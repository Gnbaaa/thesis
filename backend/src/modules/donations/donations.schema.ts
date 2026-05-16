import { z } from 'zod';

export const listDonationPostsQuery = z.object({
  q: z.string().max(120).optional(),
  status: z.enum(['active', 'completed']).optional(),
  lastDays: z.coerce.number().int().min(1).max(365).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(40).optional().default(8),
});

export const donationPostIdParams = z.object({
  id: z.string().uuid('ID буруу байна'),
});

export const createDonationPostBody = z.object({
  title: z.string().min(1, 'Гарчиг шаардлагатай').max(200, 'Гарчиг хэт урт байна'),
  description: z.string().min(1, 'Тайлбар шаардлагатай').max(5000, 'Тайлбар хэт урт байна'),
  goalAmount: z.coerce
    .number()
    .int('Бүхэл тоо оруулна уу')
    .min(1000, 'Зорилтот дүн хэт бага байна')
    .max(10_000_000_000, 'Зорилтот дүн хэт их байна'),
  status: z.enum(['active', 'completed']).optional().default('active'),
  photoPublicId: z.string().min(1).max(500).optional().nullable(),
});

export const updateDonationPostBody = createDonationPostBody;

export const donateBody = z.object({
  amount: z.coerce
    .number()
    .int('Бүхэл тоо оруулна уу')
    .min(1000, 'Хамгийн багадаа 1,000₮')
    .max(10_000_000, 'Хэт их дүн'),
  paymentMethod: z.enum(['card', 'bank', 'qpay']),
});
