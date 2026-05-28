import { createPetBody, updatePetBody } from './pets.schema';
import type { z } from 'zod';
import type { OwnerPetActivityReport, PetListQuery } from './pets.types';
import * as cache from '../../shared/cache';
import { ForbiddenError, NotFoundError } from '../../shared/errors';
import * as repo from './pets.repository';

const PETS_LIST_CACHE_PREFIX = 'pets:list:';

async function invalidatePetsListCache(): Promise<void> {
  await cache.delByPrefix(PETS_LIST_CACHE_PREFIX);
}

export async function listPets(query: PetListQuery) {
  const key = cache.buildListCacheKey(PETS_LIST_CACHE_PREFIX, query);
  return cache.wrap(key, cache.LIST_CACHE_TTL_SEC, () => repo.listPets(query));
}

/**
 * UC-014: Үйл ажиллагааны тайлан → Амьтны зар таб.
 * Эзэмшигчийн оруулсан амьтдын статистикийг буцаана.
 */
export async function getOwnerActivityReport(
  ownerId: string,
  range?: { from?: string; to?: string },
): Promise<OwnerPetActivityReport> {
  return await repo.getOwnerPetActivityReport(ownerId, {
    recentLimit: range ? 200 : 20,
    range,
  });
}

type CreateBody = z.infer<typeof createPetBody>;

export async function createPet(params: { ownerId: string; ownerRole: string; body: CreateBody }) {
  if (params.ownerRole === 'admin') {
    throw new ForbiddenError('Админ энэ зар нэмэх боломжгүй.', 'ADMIN_CANNOT_CREATE_PET');
  }
  const b = params.body;
  const created = await repo.createPet({
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
  await invalidatePetsListCache();
  return created;
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
  await invalidatePetsListCache();
  return updated;
}

export async function deletePet(params: { petId: string; ownerId: string }) {
  const owner = await repo.findPetOwnerId(params.petId);
  if (!owner) {
    throw new NotFoundError('Амьтны зар олдсонгүй', 'PET_NOT_FOUND');
  }
  if (owner !== params.ownerId) {
    throw new ForbiddenError('Та энэ амьтны зарыг устгах эрхгүй байна.', 'PET_DELETE_FORBIDDEN');
  }

  const deleted = await repo.deletePet({ id: params.petId, ownerId: params.ownerId });
  if (!deleted) {
    throw new NotFoundError('Амьтны зар олдсонгүй', 'PET_NOT_FOUND');
  }
  await invalidatePetsListCache();
}

