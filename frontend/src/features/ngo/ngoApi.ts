import { api } from '@/lib/api';

export type CreateNgoApplicationBody = {
  orgName: string;
  regNumber: string;
  orgAddress: string;
  activityDirection: string;
  contactPhone: string;
  contactEmail: string;
  description?: string;
};

export type NgoApplication = {
  id: string;
  userId: string;
  orgName: string;
  regNumber: string;
  orgAddress: string;
  activityDirection: string;
  contactPhone: string;
  contactEmail: string;
  description: string | null;
  documentPublicId: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
};

export type CreateNgoApplicationResponse = { application: NgoApplication };

export async function submitNgoApplication(params: {
  body: CreateNgoApplicationBody;
  document: File;
}): Promise<CreateNgoApplicationResponse> {
  const form = new FormData();
  form.append('document', params.document);
  Object.entries(params.body).forEach(([k, v]) => {
    if (v === undefined) return;
    form.append(k, v);
  });

  const { data } = await api.post<CreateNgoApplicationResponse>('/api/v1/ngo/applications', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

