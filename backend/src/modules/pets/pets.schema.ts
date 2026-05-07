import { z } from 'zod';

export const listPetsQuery = z.object({
  q: z.string().max(120).optional(),
  species: z.enum(['dog', 'cat', 'other']).optional(),
  sex: z.enum(['male', 'female', 'unknown']).optional(),
  status: z.enum(['available', 'pending', 'adopted']).optional(),
  minAge: z.coerce.number().int().min(0).max(60).optional(),
  maxAge: z.coerce.number().int().min(0).max(60).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(40).optional().default(8),
});

export const petIdParams = z.object({
  id: z.string().uuid(),
});

export const createPetBody = z.object({
  name: z.string().min(1).max(120),
  species: z.enum(['dog', 'cat', 'other']),
  sex: z.enum(['male', 'female', 'unknown']),
  breed: z.string().max(200).optional().nullable(),
  ageYears: z.coerce.number().int().min(0).max(50).optional().nullable(),
  vaccinated: z.boolean(),
  neutered: z.boolean(),
  spayed: z.boolean(),
  description: z.string().max(5000).optional().nullable(),
  photoPublicId: z.string().min(1).max(500).optional().nullable(),
});

export const updatePetBody = createPetBody;

