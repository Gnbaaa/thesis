import { api } from '@/lib/api';

export type LoginBody = {
  email: string;
  password: string;
};

export type RegisterBody = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
};

export type AuthTokensResponse = {
  accessToken?: string;
  refreshToken?: string;
};

export type ForgotPasswordBody = {
  email: string;
};

export type ForgotPasswordResponse = {
  ok: true;
  token?: string;
  expiresInSeconds?: number;
};

export type ResetPasswordBody = {
  token: string;
  newPassword: string;
};

export type ResetPasswordResponse = {
  ok: true;
};

export async function loginRequest(body: LoginBody): Promise<AuthTokensResponse> {
  const { data } = await api.post<AuthTokensResponse>('/api/v1/auth/login', body);
  return data;
}

export async function registerRequest(body: RegisterBody): Promise<AuthTokensResponse> {
  const { data } = await api.post<AuthTokensResponse>('/api/v1/auth/register', body);
  return data;
}

export async function forgotPasswordRequest(body: ForgotPasswordBody): Promise<ForgotPasswordResponse> {
  const { data } = await api.post<ForgotPasswordResponse>('/api/v1/auth/forgot-password', body);
  return data;
}

export async function resetPasswordRequest(body: ResetPasswordBody): Promise<ResetPasswordResponse> {
  const { data } = await api.post<ResetPasswordResponse>('/api/v1/auth/reset-password', body);
  return data;
}

export function getGoogleAuthUrl(): string {
  const base = process.env.VITE_API_URL ?? '';
  return `${base.replace(/\/$/, '')}/api/v1/auth/google`;
}
