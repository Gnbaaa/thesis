import { z } from 'zod';

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Огноо буруу байна (YYYY-MM-DD)');

export const listVolunteerPostsQuery = z.object({
  q: z.string().max(120).optional(),
  status: z.enum(['active', 'completed']).optional(),
  location: z.string().max(120).optional(),
  lastDays: z.coerce.number().int().min(1).max(365).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(40).optional().default(8),
});

export const volunteerPostIdParams = z.object({
  id: z.string().uuid('ID буруу байна'),
});

export const createVolunteerPostBody = z.object({
  title: z.string().min(1, 'Гарчиг шаардлагатай').max(200, 'Гарчиг хэт урт байна'),
  description: z.string().min(1, 'Тайлбар шаардлагатай').max(5000, 'Тайлбар хэт урт байна'),
  location: z.string().min(1, 'Байршил шаардлагатай').max(200, 'Байршил хэт урт байна'),
  eventDate: isoDate,
  requiredCount: z.coerce
    .number()
    .int('Бүхэл тоо оруулна уу')
    .min(1, 'Хамгийн багадаа 1')
    .max(10000, 'Хэтэрхий олон байна'),
  status: z.enum(['active', 'completed']).optional().default('active'),
  photoPublicId: z.string().min(1).max(500).optional().nullable(),
});

export const updateVolunteerPostBody = createVolunteerPostBody;
