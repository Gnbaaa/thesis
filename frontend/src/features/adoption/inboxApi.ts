import { api } from '@/lib/api';

export type AdoptionRequestStatus = 'pending' | 'approved' | 'rejected';

export type AdoptionInboxItem = {
  id: string;
  petId: string;
  petName: string;
  requesterId: string;
  requesterName: string;
  createdAt: string;
  status: AdoptionRequestStatus;
};

export type AdoptionInboxResponse = {
  pendingCount: number;
  items: AdoptionInboxItem[];
};

export async function getAdoptionInbox(params: { limit?: number } = {}): Promise<AdoptionInboxResponse> {
  const { data } = await api.get<AdoptionInboxResponse>('/api/v1/adoption/inbox', {
    params: { limit: params.limit ?? 5 },
  });
  return data;
}

export async function getMyAdoptionRequests(params: { limit?: number } = {}): Promise<AdoptionInboxResponse> {
  const { data } = await api.get<AdoptionInboxResponse>('/api/v1/adoption/my-requests', {
    params: { limit: params.limit ?? 5 },
  });
  return data;
}

export type AdoptionRequestDetail = {
  id: string;
  pet: {
    id: string;
    name: string;
    species: string;
    sex: string | null;
    ageYears: number | null;
    breed: string | null;
    photoUrl: string | null;
  };
  requester: { id: string; name: string };
  reason: string;
  livingEnvironment: 'apartment' | 'house' | 'other';
  hasOwnedPetBefore: boolean;
  householdSize: number | null;
  contactPhone: string | null;
  createdAt: string;
  status: AdoptionRequestStatus;
};

export async function getIncomingRequests(params: { limit?: number } = {}): Promise<AdoptionInboxResponse> {
  const { data } = await api.get<AdoptionInboxResponse>('/api/v1/adoption/inbox', {
    params: { limit: params.limit ?? 20 },
  });
  return data;
}

export async function getIncomingRequestDetail(id: string): Promise<AdoptionRequestDetail> {
  const { data } = await api.get<AdoptionRequestDetail>(`/api/v1/adoption/requests/${encodeURIComponent(id)}`);
  return data;
}

export async function resolveIncomingRequest(params: { id: string; action: 'approve' | 'reject' }): Promise<{ ok: true }> {
  const { data } = await api.post<{ ok: true }>(`/api/v1/adoption/requests/${encodeURIComponent(params.id)}/resolve`, {
    action: params.action,
  });
  return data;
}

