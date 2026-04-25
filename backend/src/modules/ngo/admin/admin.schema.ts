import { z } from 'zod';

export const listQuery = z.object({
  q: z.string().max(120).optional(),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).optional().default(8),
});

export const updateStatusBody = z.object({
  status: z.enum(['approved', 'rejected'], { message: 'Төлөв буруу байна' }),
  note: z.string().max(500, 'Тайлбар хэт урт байна').optional(),
});

