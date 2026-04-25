import { api } from '@/lib/api';

export type AdminNgoApplicationStatus = 'pending' | 'approved' | 'rejected';

export type AdminNgoApplicationListItem = {
  id: string;
  requesterName: string;
  orgName: string;
  submittedAt: string;
  status: AdminNgoApplicationStatus;
};

export type AdminNgoListResponse = {
  items: AdminNgoApplicationListItem[];
  total: number;
  page: number;
  pageSize: number;
};

export type AdminNgoApplicationDetail = {
  id: string;
  userId: string;
  requesterName: string;
  requesterEmail: string;
  orgName: string;
  regNumber: string;
  orgAddress: string;
  activityDirection: string;
  contactPhone: string;
  contactEmail: string;
  description: string | null;
  documentPublicId: string;
  documentOriginalName?: string | null;
  documentBytes?: number | null;
  documentUrl: string | null;
  submittedAt: string;
  status: AdminNgoApplicationStatus;
};

export async function adminListNgoApplications(params: {
  q?: string;
  status?: AdminNgoApplicationStatus | 'all';
  page?: number;
  pageSize?: number;
}): Promise<AdminNgoListResponse> {
  const { data } = await api.get<AdminNgoListResponse>('/api/v1/ngo/admin/applications', {
    params: {
      q: params.q || undefined,
      status: params.status && params.status !== 'all' ? params.status : undefined,
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 8,
    },
  });
  return data;
}

export async function adminGetNgoApplication(id: string): Promise<{ application: AdminNgoApplicationDetail }> {
  const { data } = await api.get<{ application: AdminNgoApplicationDetail }>(`/api/v1/ngo/admin/applications/${id}`);
  return data;
}

export async function adminUpdateNgoApplicationStatus(params: {
  id: string;
  status: 'approved' | 'rejected';
  note?: string;
}): Promise<{ application: AdminNgoApplicationDetail }> {
  const { data } = await api.patch<{ application: AdminNgoApplicationDetail }>(
    `/api/v1/ngo/admin/applications/${params.id}`,
    { status: params.status, note: params.note },
  );
  return data;
}

