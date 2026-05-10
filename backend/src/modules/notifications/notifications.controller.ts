import type { Request, Response } from 'express';
import * as service from './notifications.service';
import type { NotificationType } from './notifications.types';

export async function listMy(req: Request, res: Response) {
  const q = (req as Request & { validatedQuery?: unknown }).validatedQuery as { limit: number; excludeType?: NotificationType };
  const userId = req.user!.id;
  const data = await service.listMyNotifications({
    userId,
    limit: q.limit,
    ...(q.excludeType ? { excludeType: q.excludeType } : {}),
  });
  res.json(data);
}

export async function markAllRead(req: Request, res: Response) {
  const userId = req.user!.id;
  const q = (req as Request & { validatedQuery?: unknown }).validatedQuery as {
    type?: NotificationType;
    excludeType?: NotificationType;
    actionUrl?: string;
  } | undefined;
  const data =
    q?.type || q?.excludeType || q?.actionUrl
      ? await service.markAllMyNotificationsReadWhere({
          userId,
          ...(q.type ? { type: q.type } : {}),
          ...(q.excludeType ? { excludeType: q.excludeType } : {}),
          ...(q.actionUrl ? { actionUrl: q.actionUrl } : {}),
        })
      : await service.markAllMyNotificationsRead(userId);
  res.json(data);
}

export async function markRead(req: Request, res: Response) {
  const p = (req as Request & { validatedParams?: unknown }).validatedParams as { id: string };
  const userId = req.user!.id;
  const data = await service.markMyNotificationRead({ userId, id: p.id });
  res.json(data);
}

export async function unreadCount(req: Request, res: Response) {
  const userId = req.user!.id;
  const q = (req as Request & { validatedQuery?: unknown }).validatedQuery as { type?: NotificationType; excludeType?: NotificationType };
  const data =
    q?.type || q?.excludeType
      ? await service.getMyUnreadCountWhere({
          userId,
          ...(q.type ? { type: q.type } : {}),
          ...(q.excludeType ? { excludeType: q.excludeType } : {}),
        })
      : await service.getMyUnreadCount(userId);
  res.json(data);
}

