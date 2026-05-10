import { z } from 'zod';

export const userIdParamsSchema = z.object({
  id: z.string().trim().min(1, 'Хэрэглэгчийн ID буруу байна.'),
});

