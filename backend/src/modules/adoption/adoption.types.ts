export type LivingEnvironment = 'apartment' | 'house' | 'other';
export type AdoptionRequestStatus = 'pending' | 'approved' | 'rejected';

export type CreateAdoptionRequestInput = {
  petId: string;
  requesterId: string;
  reason: string;
  livingEnvironment: LivingEnvironment;
  hasOwnedPetBefore: boolean;
  householdSize: number | null;
  contactPhone: string | null;
};

export type AdoptionRequestCreated = { id: string };

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

export type MyAdoptionItem = AdoptionInboxItem;

export type MyAdoptionResponse = {
  pendingCount: number;
  items: MyAdoptionItem[];
};

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
  requester: {
    id: string;
    name: string;
  };
  reason: string;
  livingEnvironment: LivingEnvironment;
  hasOwnedPetBefore: boolean;
  householdSize: number | null;
  contactPhone: string | null;
  createdAt: string;
  status: AdoptionRequestStatus;
};

