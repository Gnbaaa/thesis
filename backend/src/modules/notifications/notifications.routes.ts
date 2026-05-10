import { Router } from 'express';
import { authRequired } from '../../shared/auth';
import { validateQuery } from '../../shared/validateQuery';
import { validateParams } from '../../shared/validateParams';
import * as ctrl from './notifications.controller';
import { listNotificationsQuerySchema, markAllReadQuerySchema, notificationIdParamsSchema, unreadCountQuerySchema } from './notifications.schema';

export const notificationsRouter = Router();

notificationsRouter.get('/', authRequired, validateQuery(listNotificationsQuerySchema), ctrl.listMy);
notificationsRouter.get('/unread-count', authRequired, validateQuery(unreadCountQuerySchema), ctrl.unreadCount);
notificationsRouter.post('/mark-all-read', authRequired, validateQuery(markAllReadQuerySchema), ctrl.markAllRead);
notificationsRouter.post('/:id/read', authRequired, validateParams(notificationIdParamsSchema), ctrl.markRead);

