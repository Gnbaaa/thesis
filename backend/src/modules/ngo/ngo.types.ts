export type NgoApplicationStatus = 'pending' | 'approved' | 'rejected';

export type NgoApplication = {
  id: string;
  userId: string;
  requesterName?: string;
  requesterEmail?: string;
  orgName: string;
  regNumber: string;
  orgAddress: string;
  activityDirection: string;
  contactPhone: string;
  contactEmail: string;
  description: string | null;
  documentPublicId: string;
  documentResourceType?: 'image' | 'raw';
  documentFormat?: string | null;
  documentUrl?: string | null;
  documentOriginalName?: string | null;
  documentBytes?: number | null;
  submittedAt: string;
  status: NgoApplicationStatus;
};

export type CreateNgoApplicationInput = {
  orgName: string;
  regNumber: string;
  orgAddress: string;
  activityDirection: string;
  contactPhone: string;
  contactEmail: string;
  description?: string;
};

export type Ngo = {
  id: string;
  ownerId: string;
  applicationId: string;
  orgName: string;
  regNumber: string;
  orgAddress: string;
  activityDirection: string;
  contactPhone: string;
  contactEmail: string;
  description: string | null;
  documentPublicId: string;
  documentResourceType: 'image' | 'raw';
  documentFormat: string | null;
  documentOriginalName: string | null;
  documentBytes: number | null;
  createdAt: string;
  updatedAt: string;
};

