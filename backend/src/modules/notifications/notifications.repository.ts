import { getPool } from '../../infra/db/pool';
import type { NotificationListItem, NotificationType } from './notifications.types';

type Row = {
  id: string;
  type: string;
  title: string;
  body: string;
  action_label: string | null;
  action_url: string | null;
  is_read: boolean;
  created_at: string;
};

function formatTimeLabel(createdAtIso: string): string {
  const d = new Date(createdAtIso);
  if (Number.isNaN(d.getTime())) return createdAtIso;

  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate();
  if (isYesterday) return 'Өчигдөр';

  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${mm}.${dd}`;
}

function mapRow(r: Row): NotificationListItem {
  return {
    id: r.id,
    type: r.type as NotificationType,
    title: r.title,
    body: r.body,
    timeLabel: formatTimeLabel(r.created_at),
    createdAt: r.created_at,
    isRead: Boolean(r.is_read),
    actionLabel: r.action_label ?? null,
    actionUrl: r.action_url ?? null,
  };
}

export async function listNotifications(params: { userId: string; limit: number }): Promise<NotificationListItem[]> {
  const { rows } = await getPool().query<Row>(
    `SELECT id, type, title, body, action_label, action_url, is_read, created_at::text as created_at
     FROM notifications
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [params.userId, params.limit],
  );
  return rows.map(mapRow);
}

export async function listNotificationsExcludingType(params: {
  userId: string;
  limit: number;
  excludeType: string;
}): Promise<NotificationListItem[]> {
  const { rows } = await getPool().query<Row>(
    `SELECT id, type, title, body, action_label, action_url, is_read, created_at::text as created_at
     FROM notifications
     WHERE user_id = $1 AND type <> $3
     ORDER BY created_at DESC
     LIMIT $2`,
    [params.userId, params.limit, params.excludeType],
  );
  return rows.map(mapRow);
}

export async function createNotification(params: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  actionLabel?: string | null;
  actionUrl?: string | null;
  sourceId?: string | null;
}): Promise<void> {
  await getPool().query(
    `INSERT INTO notifications (user_id, type, title, body, action_label, action_url, source_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (user_id, source_id) WHERE source_id IS NOT NULL DO NOTHING`,
    [
      params.userId,
      params.type,
      params.title,
      params.body,
      params.actionLabel ?? null,
      params.actionUrl ?? null,
      params.sourceId ?? null,
    ],
  );
}

export async function markAllRead(userId: string): Promise<number> {
  const res = await getPool().query(
    `UPDATE notifications
     SET is_read = TRUE
     WHERE user_id = $1 AND is_read = FALSE`,
    [userId],
  );
  return res.rowCount ?? 0;
}

export async function markAllReadWhere(params: {
  userId: string;
  type?: string | null;
  excludeType?: string | null;
  actionUrl?: string | null;
}): Promise<number> {
  const values: Array<string> = [params.userId];
  const where: string[] = ['user_id = $1', 'is_read = FALSE'];
  if (params.type) {
    values.push(params.type);
    where.push(`type = $${values.length}`);
  }
  if (params.excludeType) {
    values.push(params.excludeType);
    where.push(`type <> $${values.length}`);
  }
  if (params.actionUrl) {
    values.push(params.actionUrl);
    where.push(`action_url = $${values.length}`);
  }
  const res = await getPool().query(
    `UPDATE notifications
     SET is_read = TRUE
     WHERE ${where.join(' AND ')}`,
    values,
  );
  return res.rowCount ?? 0;
}

export async function markRead(params: { userId: string; id: string }): Promise<boolean> {
  const res = await getPool().query(
    `UPDATE notifications
     SET is_read = TRUE
     WHERE user_id = $1 AND id = $2`,
    [params.userId, params.id],
  );
  return (res.rowCount ?? 0) > 0;
}

export async function countUnread(userId: string): Promise<number> {
  const { rows } = await getPool().query<{ total: string }>(
    `SELECT COUNT(*)::text as total
     FROM notifications
     WHERE user_id = $1 AND is_read = FALSE`,
    [userId],
  );
  return Number(rows[0]?.total ?? 0);
}

export async function countUnreadWhere(params: {
  userId: string;
  type?: string | null;
  excludeType?: string | null;
}): Promise<number> {
  const values: Array<string> = [params.userId];
  const where: string[] = ['user_id = $1', 'is_read = FALSE'];
  if (params.type) {
    values.push(params.type);
    where.push(`type = $${values.length}`);
  }
  if (params.excludeType) {
    values.push(params.excludeType);
    where.push(`type <> $${values.length}`);
  }
  const { rows } = await getPool().query<{ total: string }>(
    `SELECT COUNT(*)::text as total
     FROM notifications
     WHERE ${where.join(' AND ')}`,
    values,
  );
  return Number(rows[0]?.total ?? 0);
}

