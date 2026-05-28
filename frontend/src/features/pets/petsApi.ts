import { api } from '@/lib/api';

export type PetStatus = 'available' | 'pending' | 'adopted';
export type PetSpecies = 'dog' | 'cat' | 'other';
export type PetSex = 'male' | 'female' | 'unknown';

export type CreatePetRequest = {
  name: string;
  species: PetSpecies;
  sex: PetSex;
  breed: string | null;
  ageYears: number | null;
  description: string | null;
  photoPublicId: string | null;
  vaccinated: boolean;
  neutered: boolean;
  spayed: boolean;
};

export type PetListItem = {
  id: string;
  name: string;
  species: PetSpecies;
  breed: string | null;
  sex: PetSex;
  ageYears: number | null;
  status: PetStatus;
  photoUrl: string | null;
};

export type PetListResponse = {
  items: PetListItem[];
  total: number;
  page: number;
  pageSize: number;
};

export type PetOwnerPublic = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  role: string;
};

export type PetDetail = {
  id: string;
  name: string;
  species: PetSpecies;
  breed: string | null;
  sex: PetSex;
  ageYears: number | null;
  status: PetStatus;
  location: string | null;
  description: string | null;
  vaccinated: boolean;
  neutered: boolean;
  spayed: boolean;
  photoUrl: string | null;
  createdAt: string;
  owner: PetOwnerPublic;
  myRequestStatus?: 'pending' | 'approved' | 'rejected';
};

export async function listPets(params: {
  q?: string;
  species?: PetSpecies | 'all';
  sex?: PetSex | 'all';
  status?: PetStatus | 'all';
  minAge?: number;
  maxAge?: number;
  page?: number;
  pageSize?: number;
}): Promise<PetListResponse> {
  const { data } = await api.get<PetListResponse>('/api/v1/pets', {
    params: {
      q: params.q || undefined,
      species: params.species && params.species !== 'all' ? params.species : undefined,
      sex: params.sex && params.sex !== 'all' ? params.sex : undefined,
      status: params.status && params.status !== 'all' ? params.status : undefined,
      minAge: typeof params.minAge === 'number' ? params.minAge : undefined,
      maxAge: typeof params.maxAge === 'number' ? params.maxAge : undefined,
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 8,
    },
  });
  return data;
}

export async function getPet(id: string): Promise<PetDetail> {
  const { data } = await api.get<PetDetail>(`/api/v1/pets/${encodeURIComponent(id)}`);
  return data;
}

export async function createPet(body: CreatePetRequest): Promise<{ id: string }> {
  const { data } = await api.post<{ id: string }>('/api/v1/pets', body);
  return data;
}

export async function updatePet(id: string, body: CreatePetRequest): Promise<{ id: string }> {
  const { data } = await api.patch<{ id: string }>(`/api/v1/pets/${encodeURIComponent(id)}`, body);
  return data;
}

export async function deletePet(id: string): Promise<void> {
  await api.delete(`/api/v1/pets/${encodeURIComponent(id)}`);
}

export type UploadImageResponse = {
  publicId: string;
  url: string;
  bytes: number;
  width?: number;
  height?: number;
};

export async function uploadPetImage(file: File): Promise<UploadImageResponse> {
  const form = new FormData();
  form.append('file', file);
  form.append('folder', 'pets');
  const { data } = await api.post<UploadImageResponse>('/api/v1/uploads', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

