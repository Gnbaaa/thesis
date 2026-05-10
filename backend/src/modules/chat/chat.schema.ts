import { z } from 'zod';

export const listConversationsQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : 20))
    .refine((v) => Number.isFinite(v) && v >= 1 && v <= 100, 'limit буруу байна.'),
});

export const conversationParamsSchema = z.object({
  id: z.string().trim().min(1, 'conversation id буруу байна.'),
});

export const listMessagesQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : 30))
    .refine((v) => Number.isFinite(v) && v >= 1 && v <= 100, 'limit буруу байна.'),
});

export const sendMessageBodySchema = z.object({
  text: z.string().trim().min(1, 'Зурвасаа бичнэ үү.').max(4000, 'Зурвас хэт урт байна.'),
  recipientId: z.string().trim().min(1, 'Хүлээн авагч буруу байна.'),
});

