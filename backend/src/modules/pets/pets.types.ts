export type PetStatus = 'available' | 'pending' | 'adopted';
export type PetSpecies = 'dog' | 'cat' | 'other';
export type PetSex = 'male' | 'female' | 'unknown';

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

export type PetOwnerPublic = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  role: string;
};

export type MyAdoptionRequestStatus = 'pending' | 'approved' | 'rejected';

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
  /** Present only when requester is authenticated and has a request for this pet. */
  myRequestStatus?: MyAdoptionRequestStatus;
};

export type PetListQuery = {
  q?: string;
  species?: PetSpecies;
  sex?: PetSex;
  status?: PetStatus;
  minAge?: number;
  maxAge?: number;
  page: number;
  pageSize: number;
};

export type OwnerPetActivityItem = {
  id: string;
  name: string;
  species: PetSpecies;
  status: PetStatus;
  photoUrl: string | null;
  createdAt: string;
};

export type OwnerPetActivityReport = {
  totalCount: number;
  byStatus: Record<PetStatus, number>;
  /** Сүүлийн өргөтгөл (recent listings). */
  recent: OwnerPetActivityItem[];
};

export type CreatePetInput = {
  ownerId: string;
  name: string;
  species: PetSpecies;
  sex: PetSex;
  breed: string | null;
  ageYears: number | null;
  status: PetStatus;
  description: string | null;
  photoPublicId: string | null;
  vaccinated: boolean;
  neutered: boolean;
  spayed: boolean;
};

