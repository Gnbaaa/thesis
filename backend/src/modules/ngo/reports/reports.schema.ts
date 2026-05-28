import { z } from 'zod';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Огноо буруу байна (YYYY-MM-DD)');

export const reportsQuery = z
  .object({
    from: isoDate.optional(),
    to: isoDate.optional(),
  })
  .refine((v) => !v.from || !v.to || v.from <= v.to, {
    message: 'Эхлэх огноо дуусах огнооноос хойш байж болохгүй',
    path: ['to'],
  });

export type ReportsQuery = z.infer<typeof reportsQuery>;
