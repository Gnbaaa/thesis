import * as repo from './notifications.repository';
import type { NotificationListItem, NotificationType } from './notifications.types';

export async function listMyNotifications(params: {
  userId: string;
  limit: number;
  excludeType?: NotificationType;
}): Promise<{ items: NotificationListItem[] }> {
  const items = params.excludeType
    ? await repo.listNotificationsExcludingType({ userId: params.userId, limit: params.limit, excludeType: params.excludeType })
    : await repo.listNotifications({ userId: params.userId, limit: params.limit });
  return { items };
}

export async function markAllMyNotificationsRead(userId: string): Promise<{ updated: number }> {
  const updated = await repo.markAllRead(userId);
  return { updated };
}

export async function markAllMyNotificationsReadWhere(params: {
  userId: string;
  type?: NotificationType;
  excludeType?: NotificationType;
  actionUrl?: string;
}): Promise<{ updated: number }> {
  const updated = await repo.markAllReadWhere({
    userId: params.userId,
    type: params.type ?? null,
    excludeType: params.excludeType ?? null,
    actionUrl: params.actionUrl ?? null,
  });
  return { updated };
}

export async function markMyNotificationRead(params: { userId: string; id: string }): Promise<{ ok: true }> {
  await repo.markRead(params);
  return { ok: true };
}

export async function getMyUnreadCount(userId: string): Promise<{ count: number }> {
  const count = await repo.countUnread(userId);
  return { count };
}

export async function getMyUnreadCountWhere(params: {
  userId: string;
  type?: NotificationType;
  excludeType?: NotificationType;
}): Promise<{ count: number }> {
  const count = await repo.countUnreadWhere({
    userId: params.userId,
    type: params.type ?? null,
    excludeType: params.excludeType ?? null,
  });
  return { count };
}

export async function notify(params: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  actionLabel?: string | null;
  actionUrl?: string | null;
  sourceId?: string | null;
}): Promise<void> {
  await repo.createNotification(params);
}

