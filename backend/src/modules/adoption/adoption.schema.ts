import { z } from 'zod';

export const createAdoptionRequestBody = z.object({
  petId: z.string().uuid(),
  reason: z.string().trim().min(10).max(3000),
  livingEnvironment: z.enum(['apartment', 'house', 'other']),
  hasOwnedPetBefore: z.boolean(),
  householdSize: z.coerce.number().int().min(1).max(30).optional().nullable(),
  contactPhone: z.string().trim().max(40).optional().nullable(),
});

export const inboxQuery = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional().default(5),
});

export const requestIdParams = z.object({
  id: z.string().uuid(),
});

export const resolveBody = z.object({
  action: z.enum(['approve', 'reject']),
});

