import { z } from 'zod';

export const userRoleEnum = z.enum(['user', 'ngo', 'admin']);
export const userStatusEnum = z.enum(['active', 'suspended', 'closed']);

export const listQuery = z.object({
  q: z.string().trim().max(120).optional(),
  role: userRoleEnum.optional(),
  status: userStatusEnum.optional(),
  page: z
    .union([z.coerce.number().int().min(1).max(10_000), z.undefined()])
    .transform((v) => v ?? 1),
  pageSize: z
    .union([z.coerce.number().int().min(1).max(100), z.undefined()])
    .transform((v) => v ?? 10),
});

export const updateRoleBody = z.object({
  role: userRoleEnum,
});

export const updateStatusBody = z.object({
  status: userStatusEnum,
});

export const userIdParams = z.object({
  id: z.string().uuid(),
});
