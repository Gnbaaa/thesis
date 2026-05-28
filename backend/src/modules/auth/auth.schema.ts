import { z } from 'zod';

const email = z.string().email('И-мэйл буруу байна');

const password = z
  .string()
  .min(8, 'Нууц үг хамгийн багадаа 8 тэмдэгттэй байна')
  .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), 'Нууц үг дор хаяж 1 үсэг, 1 тоо агуулна');

export const registerBody = z.object({
  email,
  password,
  firstName: z.string().max(40, 'Нэр хэт урт байна').optional().default(''),
  lastName: z.string().max(40, 'Овог хэт урт байна').optional().default(''),
  phone: z.string().max(8, 'Утасны дугаар хэт урт байна').optional(),
});

export const loginBody = z.object({
  email,
  password: z.string().min(1, 'Нууц үг шаардлагатай'),
});

export const refreshBody = z.object({
  refreshToken: z.string().min(10, 'Refresh token буруу байна'),
});

export const forgotPasswordBody = z.object({
  email,
});

export const resetPasswordBody = z.object({
  token: z.string().min(20, 'Token буруу байна'),
  newPassword: password,
});

