import { api } from '@/lib/api';

export type UserProfile = {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  avatarUrl: string | null;
  status: 'active';
};

export async function getMyProfile(): Promise<UserProfile> {
  const { data } = await api.get<UserProfile>('/api/v1/users/me');
  return data;
}

export async function uploadMyAvatar(file: File): Promise<UserProfile> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post<UserProfile>('/api/v1/users/me/avatar', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

