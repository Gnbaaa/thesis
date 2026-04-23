import { z } from 'zod';
import type { TFunction } from 'i18next';

const phoneRegex = /^[0-9+][0-9\s-]{7,}$/;

export function loginSchema(t: TFunction) {
  return z.object({
    email: z.string().min(1, t('auth.validation.required')).email(t('auth.validation.email')),
    password: z.string().min(8, t('auth.validation.passwordMin')),
  });
}

export type LoginFormValues = z.infer<ReturnType<typeof loginSchema>>;

export function registerSchema(t: TFunction) {
  return z
    .object({
      lastName: z.string().min(1, t('auth.validation.required')),
      firstName: z.string().min(1, t('auth.validation.required')),
      email: z.string().min(1, t('auth.validation.required')).email(t('auth.validation.email')),
      phone: z.string().min(1, t('auth.validation.required')).regex(phoneRegex, t('auth.validation.phone')),
      password: z.string().min(8, t('auth.validation.passwordMin')),
      passwordConfirm: z.string().min(1, t('auth.validation.required')),
    })
    .refine((data) => data.password === data.passwordConfirm, {
      message: t('auth.validation.passwordMismatch'),
      path: ['passwordConfirm'],
    });
}

export type RegisterFormValues = z.infer<ReturnType<typeof registerSchema>>;
