import { api } from '@/lib/api';

export type VolunteerPostStatus = 'active' | 'completed';
export type VolunteerDateRange = 'last7days' | 'last30days';

export type VolunteerPostListItem = {
  id: string;
  title: string;
  description: string;
  location: string;
  /** ISO `YYYY-MM-DD`. */
  eventDate: string;
  requiredCount: number;
  status: VolunteerPostStatus;
  photoUrl: string | null;
  createdAt: string;
};

export type VolunteerPostOwnerPublic = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  role: string;
};

export type VolunteerPostDetail = VolunteerPostListItem & {
  owner: VolunteerPostOwnerPublic;
  updatedAt: string;
  registeredCount: number;
  isRegisteredByViewer: boolean;
};

export type VolunteerPostListResponse = {
  items: VolunteerPostListItem[];
  total: number;
  page: number;
  pageSize: number;
};

export type ListVolunteerPostsParams = {
  q?: string;
  status?: VolunteerPostStatus | 'all';
  range?: VolunteerDateRange | 'all';
  page?: number;
  pageSize?: number;
};

const RANGE_TO_DAYS: Record<VolunteerDateRange, number> = {
  last7days: 7,
  last30days: 30,
};

export async function listVolunteerPosts(
  params: ListVolunteerPostsParams,
): Promise<VolunteerPostListResponse> {
  const lastDays =
    params.range && params.range !== 'all' ? RANGE_TO_DAYS[params.range] : undefined;
  const { data } = await api.get<VolunteerPostListResponse>('/api/v1/volunteer', {
    params: {
      q: params.q?.trim() ? params.q.trim() : undefined,
      status: params.status && params.status !== 'all' ? params.status : undefined,
      lastDays,
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 8,
    },
  });
  return data;
}

export async function getVolunteerPost(id: string): Promise<VolunteerPostDetail> {
  const { data } = await api.get<VolunteerPostDetail>(
    `/api/v1/volunteer/${encodeURIComponent(id)}`,
  );
  return data;
}

export type CreateVolunteerPostRequest = {
  title: string;
  description: string;
  location: string;
  eventDate: string;
  requiredCount: number;
  status?: VolunteerPostStatus;
  photoPublicId?: string | null;
};

export async function createVolunteerPost(
  body: CreateVolunteerPostRequest,
): Promise<{ id: string }> {
  const { data } = await api.post<{ id: string }>('/api/v1/volunteer', body);
  return data;
}

export async function updateVolunteerPost(
  id: string,
  body: CreateVolunteerPostRequest,
): Promise<{ id: string }> {
  const { data } = await api.patch<{ id: string }>(
    `/api/v1/volunteer/${encodeURIComponent(id)}`,
    body,
  );
  return data;
}

export async function registerForVolunteerPost(id: string): Promise<VolunteerPostDetail> {
  const { data } = await api.post<VolunteerPostDetail>(
    `/api/v1/volunteer/${encodeURIComponent(id)}/register`,
  );
  return data;
}

export async function unregisterFromVolunteerPost(id: string): Promise<VolunteerPostDetail> {
  const { data } = await api.delete<VolunteerPostDetail>(
    `/api/v1/volunteer/${encodeURIComponent(id)}/register`,
  );
  return data;
}

export type UploadImageResponse = {
  publicId: string;
  url: string;
  bytes: number;
  width?: number;
  height?: number;
};

export async function uploadVolunteerImage(file: File): Promise<UploadImageResponse> {
  const form = new FormData();
  form.append('file', file);
  form.append('folder', 'volunteer');
  const { data } = await api.post<UploadImageResponse>('/api/v1/uploads', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}
