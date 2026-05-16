export type UserRole = 'user' | 'ngo' | 'admin';
export type UserStatus = 'active' | 'suspended' | 'closed';

export type AdminUserListItem = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  avatarUrl: string | null;
  createdAt: string;
};

export type AdminUserListQuery = {
  q?: string;
  role?: UserRole;
  status?: UserStatus;
  page: number;
  pageSize: number;
};

export type AdminUserListResult = {
  items: AdminUserListItem[];
  total: number;
  page: number;
  pageSize: number;
};
