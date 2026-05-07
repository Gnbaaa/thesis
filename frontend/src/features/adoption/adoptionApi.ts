import { api } from '@/lib/api';

export type LivingEnvironment = 'apartment' | 'house' | 'other';

export type CreateAdoptionRequest = {
  petId: string;
  reason: string;
  livingEnvironment: LivingEnvironment;
  hasOwnedPetBefore: boolean;
  householdSize: number | null;
  contactPhone: string | null;
};

export async function createAdoptionRequest(body: CreateAdoptionRequest): Promise<{ id: string }> {
  const { data } = await api.post<{ id: string }>('/api/v1/adoption/requests', body);
  return data;
}

