import { api } from '@/lib/api';

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  timeLabel: string;
  createdAt: string;
  isRead: boolean;
  actionLabel: string | null;
  actionUrl: string | null;
};

export async function listNotifications(params: { limit?: number; excludeType?: string } = {}): Promise<{ items: NotificationItem[] }> {
  const { data } = await api.get<{ items: NotificationItem[] }>('/api/v1/notifications', {
    params: { limit: params.limit ?? 50, excludeType: params.excludeType ?? undefined },
  });
  return data;
}

export async function markAllNotificationsRead(): Promise<{ updated: number }> {
  const { data } = await api.post<{ updated: number }>('/api/v1/notifications/mark-all-read', {});
  return data;
}

export async function markAllNotificationsReadWhere(params: { type?: string; excludeType?: string; actionUrl?: string } = {}): Promise<{ updated: number }> {
  const { data } = await api.post<{ updated: number }>('/api/v1/notifications/mark-all-read', {}, {
    params: { type: params.type ?? undefined, excludeType: params.excludeType ?? undefined, actionUrl: params.actionUrl ?? undefined },
  });
  return data;
}

export async function markNotificationRead(id: string): Promise<{ ok: true }> {
  const { data } = await api.post<{ ok: true }>(`/api/v1/notifications/${encodeURIComponent(id)}/read`, {});
  return data;
}

export async function getUnreadNotificationCount(): Promise<{ count: number }> {
  const { data } = await api.get<{ count: number }>('/api/v1/notifications/unread-count');
  return data;
}

export async function getUnreadNotificationCountWhere(params: { type?: string; excludeType?: string } = {}): Promise<{ count: number }> {
  const { data } = await api.get<{ count: number }>('/api/v1/notifications/unread-count', {
    params: { type: params.type ?? undefined, excludeType: params.excludeType ?? undefined },
  });
  return data;
}

