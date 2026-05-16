import { Router } from 'express';
import multer from 'multer';
import { authRequired, requireRole } from '../../shared/auth';
import { validateBody } from '../../shared/validate';
import { validateQuery } from '../../shared/validateQuery';
import { validateParams } from '../../shared/validateParams';
import * as ctrl from './users.controller';
import { userIdParamsSchema } from './users.schema';
import * as adminCtrl from './admin/admin.controller';
import {
  listQuery as adminListQuery,
  updateRoleBody as adminUpdateRoleBody,
  updateStatusBody as adminUpdateStatusBody,
} from './admin/admin.schema';

const router = Router();

router.get('/me', authRequired, ctrl.me);
router.get('/public/:id', authRequired, validateParams(userIdParamsSchema), ctrl.publicProfile);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});
router.post('/me/avatar', authRequired, upload.single('file'), ctrl.uploadAvatar);

// UC-011: Admin — Хэрэглэгчийн эрх удирдах.
router.get(
  '/admin/users',
  authRequired,
  requireRole('admin'),
  validateQuery(adminListQuery),
  adminCtrl.listUsers,
);

router.patch(
  '/admin/users/:id/role',
  authRequired,
  requireRole('admin'),
  validateBody(adminUpdateRoleBody),
  adminCtrl.updateRole,
);

router.patch(
  '/admin/users/:id/status',
  authRequired,
  requireRole('admin'),
  validateBody(adminUpdateStatusBody),
  adminCtrl.updateStatus,
);

export { router as usersRouter };

