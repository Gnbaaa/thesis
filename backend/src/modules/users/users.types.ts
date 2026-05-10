export type UserProfile = {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  avatarUrl: string | null;
  status: 'active';
};

export type UserPublicProfile = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  role: string;
};

