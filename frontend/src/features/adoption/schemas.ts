import { z } from 'zod';

export function adoptionRequestSchema(t: (k: string) => string) {
  const livingEnvironments = ['apartment', 'house', 'other'] as const;
  const yesNo = ['yes', 'no'] as const;

  return z.object({
    reason: z.string().trim().min(10, t('adoption.request.errors.reason')).max(3000, t('adoption.request.errors.reasonMax')),
    livingEnvironment: z.enum(livingEnvironments, { message: t('adoption.request.errors.livingEnvironment') }),
    hasOwnedPetBefore: z.enum(yesNo, { message: t('adoption.request.errors.hasOwnedPetBefore') }),
    householdSize: z
      .string()
      .trim()
      .refine((v) => !v || /^\d{1,2}$/.test(v), t('adoption.request.errors.householdSize'))
      .optional(),
    contactPhone: z.string().trim().max(40, t('adoption.request.errors.contactPhoneMax')).optional(),
  });
}

export type AdoptionRequestFormValues = z.infer<ReturnType<typeof adoptionRequestSchema>>;

