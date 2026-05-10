import { z } from 'zod';

const notificationTypeSchema = z.enum([
  'adoption_request_approved',
  'adoption_request_rejected',
  'adoption_request_sent',
  'chat_message',
  'donation_received',
  'donation_goal_reached',
  'volunteer_registration',
]);

export const listNotificationsQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : 20))
    .refine((v) => Number.isFinite(v) && v >= 1 && v <= 100, 'limit буруу байна.'),
  excludeType: notificationTypeSchema.optional(),
});

export const notificationIdParamsSchema = z.object({
  id: z.string().trim().min(1, 'notification id буруу байна.'),
});

export const unreadCountQuerySchema = z.object({
  type: notificationTypeSchema.optional(),
  excludeType: notificationTypeSchema.optional(),
});

export const markAllReadQuerySchema = z.object({
  type: notificationTypeSchema.optional(),
  excludeType: notificationTypeSchema.optional(),
  actionUrl: z.string().trim().min(1).optional(),
});

