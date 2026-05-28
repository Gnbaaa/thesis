jest.mock('../../../src/modules/pets/pets.repository');
jest.mock('../../../src/shared/cache', () => ({
  wrap: async (_key: string, _ttl: number, fn: () => Promise<unknown>) => fn(),
  delByPrefix: jest.fn().mockResolvedValue(undefined),
  buildListCacheKey: (prefix: string, query: object) => `${prefix}${JSON.stringify(query)}`,
  LIST_CACHE_TTL_SEC: 60,
}));

import * as repo from '../../../src/modules/pets/pets.repository';
import * as petsService from '../../../src/modules/pets/pets.service';
import { ForbiddenError, NotFoundError } from '../../../src/shared/errors';

const mockRepo = jest.mocked(repo);

const samplePet = {
  id: 'pet-1',
  name: 'Luna',
  species: 'dog' as const,
  sex: 'female' as const,
  breed: null,
  ageYears: 2,
  status: 'available' as const,
  description: null,
  photoUrl: null,
  vaccinated: true,
  neutered: false,
  spayed: false,
  owner: { id: 'owner-1', displayName: 'NGO' },
};

describe('pets.service', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getPetById', () => {
    it('throws when pet is missing', async () => {
      mockRepo.findPetById.mockResolvedValue(null);
      await expect(petsService.getPetById('missing')).rejects.toThrow(NotFoundError);
    });

    it('returns pet when found', async () => {
      mockRepo.findPetById.mockResolvedValue(samplePet);
      const out = await petsService.getPetById('pet-1');
      expect(out.id).toBe('pet-1');
    });
  });

  describe('listPets', () => {
    it('delegates to repository', async () => {
      mockRepo.listPets.mockResolvedValue({ items: [], total: 0 });
      const out = await petsService.listPets({ page: 1, pageSize: 20 });
      expect(out.total).toBe(0);
    });
  });

  describe('updatePet', () => {
    const body = {
      name: '  Luna  ',
      species: 'dog' as const,
      sex: 'female' as const,
      breed: '  mix  ',
      ageYears: 3,
      description: ' friendly ',
      photoPublicId: ' img/id ',
      vaccinated: true,
      neutered: false,
      spayed: false,
    };

    it('throws when pet does not exist', async () => {
      mockRepo.findPetOwnerId.mockResolvedValue(null);
      await expect(
        petsService.updatePet({ petId: 'pet-1', ownerId: 'owner-1', body }),
      ).rejects.toThrow(NotFoundError);
    });

    it('throws when caller is not owner', async () => {
      mockRepo.findPetOwnerId.mockResolvedValue('other-owner');
      await expect(
        petsService.updatePet({ petId: 'pet-1', ownerId: 'owner-1', body }),
      ).rejects.toThrow(ForbiddenError);
    });

    it('updates pet for owner', async () => {
      mockRepo.findPetOwnerId.mockResolvedValue('owner-1');
      mockRepo.updatePet.mockResolvedValue(samplePet);

      const out = await petsService.updatePet({ petId: 'pet-1', ownerId: 'owner-1', body });
      expect(out.name).toBe('Luna');
      expect(mockRepo.updatePet).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Luna',
          breed: 'mix',
          description: 'friendly',
          photoPublicId: 'img/id',
        }),
      );
    });
  });

  describe('getPetByIdForViewer', () => {
    it('returns pet for viewer', async () => {
      mockRepo.findPetById.mockResolvedValue(samplePet);
      const out = await petsService.getPetByIdForViewer({ petId: 'pet-1', viewerId: 'viewer-1' });
      expect(out.id).toBe('pet-1');
    });
  });

  describe('updatePet', () => {
    it('throws when update returns null', async () => {
      mockRepo.findPetOwnerId.mockResolvedValue('owner-1');
      mockRepo.updatePet.mockResolvedValue(null);
      await expect(
        petsService.updatePet({
          petId: 'pet-1',
          ownerId: 'owner-1',
          body: {
            name: 'Luna',
            species: 'dog',
            sex: 'female',
            breed: null,
            ageYears: 2,
            description: null,
            photoPublicId: null,
            vaccinated: true,
            neutered: false,
            spayed: false,
          },
        }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('deletePet', () => {
    it('throws when pet does not exist', async () => {
      mockRepo.findPetOwnerId.mockResolvedValue(null);
      await expect(petsService.deletePet({ petId: 'pet-1', ownerId: 'owner-1' })).rejects.toThrow(
        NotFoundError,
      );
    });

    it('throws when caller is not owner', async () => {
      mockRepo.findPetOwnerId.mockResolvedValue('other-owner');
      await expect(petsService.deletePet({ petId: 'pet-1', ownerId: 'owner-1' })).rejects.toThrow(
        ForbiddenError,
      );
    });

    it('deletes pet for owner', async () => {
      mockRepo.findPetOwnerId.mockResolvedValue('owner-1');
      mockRepo.deletePet.mockResolvedValue({ id: 'pet-1' });
      await petsService.deletePet({ petId: 'pet-1', ownerId: 'owner-1' });
      expect(mockRepo.deletePet).toHaveBeenCalledWith({ id: 'pet-1', ownerId: 'owner-1' });
    });
  });

  describe('createPet', () => {
    it('trims optional fields and defaults status to available', async () => {
      mockRepo.createPet.mockResolvedValue(samplePet);
      await petsService.createPet({
        ownerId: 'owner-1',
        ownerRole: 'user',
        body: {
          name: '  Max  ',
          species: 'cat',
          sex: 'male',
          breed: '   ',
          ageYears: undefined,
          description: '',
          photoPublicId: undefined,
          vaccinated: false,
          neutered: false,
          spayed: false,
        },
      });
      expect(mockRepo.createPet).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Max',
          breed: null,
          description: null,
          photoPublicId: null,
          status: 'available',
        }),
      );
    });

    it('forbids admin from creating pets', async () => {
      await expect(
        petsService.createPet({
          ownerId: 'admin-1',
          ownerRole: 'admin',
          body: {
            name: 'Max',
            species: 'cat',
            sex: 'male',
            vaccinated: false,
            neutered: false,
            spayed: false,
          },
        }),
      ).rejects.toMatchObject({ code: 'ADMIN_CANNOT_CREATE_PET' });
      expect(mockRepo.createPet).not.toHaveBeenCalled();
    });
  });
});
