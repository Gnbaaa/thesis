import { api } from '@/lib/api';

export type DonationTxStatus = 'pending' | 'succeeded' | 'failed';

export type OwnerDonationActivityTransaction = {
  id: string;
  createdAt: string;
  amount: number;
  status: DonationTxStatus;
  paymentMethod: string;
  donorDisplayName: string;
  postId: string;
  postTitle: string;
  stripePaymentIntentId: string | null;
};

export type OwnerDonationActivityReport = {
  totalCollected: number;
  successCount: number;
  last7DaysCount: number;
  transactions: OwnerDonationActivityTransaction[];
};

export type PetStatus = 'available' | 'pending' | 'adopted';
export type PetSpecies = 'dog' | 'cat' | 'other';

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
  recent: OwnerPetActivityItem[];
};

export type VolunteerPostStatus = 'active' | 'completed';

export type OwnerVolunteerActivityItem = {
  id: string;
  title: string;
  location: string;
  eventDate: string;
  requiredCount: number;
  registeredCount: number;
  status: VolunteerPostStatus;
  createdAt: string;
};

export type OwnerVolunteerActivityReport = {
  totalPosts: number;
  activeCount: number;
  totalRegistrations: number;
  recent: OwnerVolunteerActivityItem[];
};

export type ActivityReportResponse = {
  donations: OwnerDonationActivityReport;
  pets: OwnerPetActivityReport;
  volunteer: OwnerVolunteerActivityReport;
};

export async function getActivityReport(): Promise<ActivityReportResponse> {
  const { data } = await api.get<ActivityReportResponse>('/api/v1/ngo/reports');
  return data;
}
