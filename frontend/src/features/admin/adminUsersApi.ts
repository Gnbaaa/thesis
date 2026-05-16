import { api } from '@/lib/api';

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
  page?: number;
  pageSize?: number;
};

export type AdminUserListResponse = {
  items: AdminUserListItem[];
  total: number;
  page: number;
  pageSize: number;
};

export async function listAdminUsers(query: AdminUserListQuery): Promise<AdminUserListResponse> {
  const { data } = await api.get<AdminUserListResponse>('/api/v1/users/admin/users', {
    params: {
      q: query.q || undefined,
      role: query.role || undefined,
      status: query.status || undefined,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 10,
    },
  });
  return data;
}

export async function updateUserRole(id: string, role: UserRole): Promise<AdminUserListItem> {
  const { data } = await api.patch<{ user: AdminUserListItem }>(
    `/api/v1/users/admin/users/${encodeURIComponent(id)}/role`,
    { role },
  );
  return data.user;
}

export async function updateUserStatus(
  id: string,
  status: UserStatus,
): Promise<AdminUserListItem> {
  const { data } = await api.patch<{ user: AdminUserListItem }>(
    `/api/v1/users/admin/users/${encodeURIComponent(id)}/status`,
    { status },
  );
  return data.user;
}
