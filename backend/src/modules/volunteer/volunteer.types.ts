export type VolunteerPostStatus = 'active' | 'completed';
export type VolunteerDateRange = 'last7days' | 'last30days';

export type VolunteerPostListItem = {
  id: string;
  title: string;
  description: string;
  location: string;
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
  /** `true` when the authenticated viewer has registered for this post. */
  isRegisteredByViewer: boolean;
};

export type VolunteerPostListQuery = {
  q?: string;
  status?: VolunteerPostStatus;
  location?: string;
  lastDays?: number;
  page: number;
  pageSize: number;
};

export type CreateVolunteerPostInput = {
  ownerId: string;
  title: string;
  description: string;
  location: string;
  eventDate: string;
  requiredCount: number;
  status: VolunteerPostStatus;
  photoPublicId: string | null;
};

export type UpdateVolunteerPostInput = {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  location: string;
  eventDate: string;
  requiredCount: number;
  status: VolunteerPostStatus;
  photoPublicId: string | null;
};
