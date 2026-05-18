jest.mock('../../../src/modules/users/users.repository');
jest.mock('../../../src/shared/storage');

import * as repo from '../../../src/modules/users/users.repository';
import * as storage from '../../../src/shared/storage';
import * as usersService from '../../../src/modules/users/users.service';
import { NotFoundError } from '../../../src/shared/errors';

const mockRepo = jest.mocked(repo);
const mockStorage = jest.mocked(storage);

describe('users.service', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getMe', () => {
    it('throws when user is missing', async () => {
      mockRepo.findMe.mockResolvedValue(null);
      await expect(usersService.getMe('missing')).rejects.toThrow(NotFoundError);
    });
  });

  describe('getPublicProfileById', () => {
    it('throws when profile is missing', async () => {
      mockRepo.findPublicByIds.mockResolvedValue([]);
      await expect(usersService.getPublicProfileById('missing')).rejects.toThrow(NotFoundError);
    });

    it('returns public profile', async () => {
      mockRepo.findPublicByIds.mockResolvedValue([{ id: 'u-1', displayName: 'Test User' }]);
      const out = await usersService.getPublicProfileById('u-1');
      expect(out.displayName).toBe('Test User');
    });
  });

  describe('uploadMyAvatar', () => {
    it('uploads image and updates avatar', async () => {
      mockStorage.uploadImage.mockResolvedValue({
        publicId: 'avatars/u1',
        resourceType: 'image',
        originalFilename: 'a.jpg',
        format: 'jpg',
        bytes: 100,
        width: 100,
        height: 100,
      });
      mockStorage.getImageUrl.mockReturnValue('https://cdn.example/a.jpg');
      mockRepo.setAvatarPublicId.mockResolvedValue(undefined);
      mockRepo.findMe.mockResolvedValue({
        id: 'u-1',
        email: 'a@b.com',
        firstName: 'A',
        lastName: 'B',
        phone: null,
        role: 'user',
        status: 'active',
        avatarUrl: 'https://cdn.example/a.jpg',
      });

      const out = await usersService.uploadMyAvatar({
        userId: 'u-1',
        buffer: Buffer.from('img'),
      });
      expect(out.avatarUrl).toContain('cdn.example');
    });
  });

  describe('getPublicProfilesByIds', () => {
    it('delegates to repository', async () => {
      mockRepo.findPublicByIds.mockResolvedValue([]);
      const out = await usersService.getPublicProfilesByIds(['u-1', 'u-2']);
      expect(out).toEqual([]);
      expect(mockRepo.findPublicByIds).toHaveBeenCalledWith(['u-1', 'u-2']);
    });
  });
});
