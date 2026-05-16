import { createPetBody, updatePetBody } from './pets.schema';
import type { z } from 'zod';
import type { OwnerPetActivityReport, PetListQuery } from './pets.types';
import { ForbiddenError, NotFoundError } from '../../shared/errors';
import * as repo from './pets.repository';

export async function listPets(query: PetListQuery) {
  return await repo.listPets(query);
}

/**
 * UC-014: Үйл ажиллагааны тайлан → Амьтны зар таб.
 * Эзэмшигчийн оруулсан амьтдын статистикийг буцаана.
 */
export async function getOwnerActivityReport(
  ownerId: string,
): Promise<OwnerPetActivityReport> {
  return await repo.getOwnerPetActivityReport(ownerId, { recentLimit: 20 });
}

type CreateBody = z.infer<typeof createPetBody>;

export async function createPet(params: { ownerId: string; body: CreateBody }) {
  const b = params.body;
  return await repo.createPet({
    ownerId: params.ownerId,
    name: b.name.trim(),
    species: b.species,
    sex: b.sex,
    breed: b.breed?.trim() ? b.breed.trim() : null,
    ageYears: typeof b.ageYears === 'number' ? b.ageYears : null,
    status: 'available',
    description: b.description?.trim() ? b.description.trim() : null,
    photoPublicId: b.photoPublicId?.trim() ? b.photoPublicId.trim() : null,
    vaccinated: b.vaccinated,
    neutered: b.neutered,
    spayed: b.spayed,
  });
}

export async function getPetById(id: string) {
  const pet = await repo.findPetById(id, null);
  if (!pet) {
    throw new NotFoundError('Амьтны зар олдсонгүй', 'PET_NOT_FOUND');
  }
  return pet;
}

export async function getPetByIdForViewer(params: { petId: string; viewerId?: string | null }) {
  const pet = await repo.findPetById(params.petId, params.viewerId ?? null);
  if (!pet) {
    throw new NotFoundError('Амьтны зар олдсонгүй', 'PET_NOT_FOUND');
  }
  return pet;
}

type UpdateBody = z.infer<typeof updatePetBody>;

export async function updatePet(params: { petId: string; ownerId: string; body: UpdateBody }) {
  const owner = await repo.findPetOwnerId(params.petId);
  if (!owner) {
    throw new NotFoundError('Амьтны зар олдсонгүй', 'PET_NOT_FOUND');
  }
  if (owner !== params.ownerId) {
    throw new ForbiddenError('Та энэ амьтны зарыг засах эрхгүй байна.', 'PET_EDIT_FORBIDDEN');
  }

  const b = params.body;
  const updated = await repo.updatePet({
    id: params.petId,
    ownerId: params.ownerId,
    name: b.name.trim(),
    species: b.species,
    sex: b.sex,
    breed: b.breed?.trim() ? b.breed.trim() : null,
    ageYears: typeof b.ageYears === 'number' ? b.ageYears : null,
    description: b.description?.trim() ? b.description.trim() : null,
    photoPublicId: b.photoPublicId?.trim() ? b.photoPublicId.trim() : null,
    vaccinated: b.vaccinated,
    neutered: b.neutered,
    spayed: b.spayed,
  });
  if (!updated) {
    throw new NotFoundError('Амьтны зар олдсонгүй', 'PET_NOT_FOUND');
  }
  return updated;
}

