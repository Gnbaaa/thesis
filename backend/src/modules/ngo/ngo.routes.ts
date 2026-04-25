import { Router } from 'express';
import multer from 'multer';
import { authRequired, requireRole } from '../../shared/auth';
import { ValidationError } from '../../shared/errors';
import { validateBody } from '../../shared/validate';
import { validateQuery } from '../../shared/validateQuery';
import { createNgoApplicationBody } from './ngo.schema';
import { listQuery, updateStatusBody } from './admin/admin.schema';
import * as ctrl from './ngo.controller';
import * as adminCtrl from './admin/admin.controller';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.post(
  '/applications',
  authRequired,
  upload.single('document'),
  (req, _res, next) => {
    if (!req.file) {
      next(new ValidationError('Баримт бичиг заавал'));
      return;
    }
    next();
  },
  validateBody(createNgoApplicationBody),
  ctrl.createApplication,
);

router.get(
  '/admin/applications',
  authRequired,
  requireRole('admin'),
  validateQuery(listQuery),
  adminCtrl.listApplications,
);

router.get(
  '/admin/applications/:id',
  authRequired,
  requireRole('admin'),
  adminCtrl.getApplication,
);

router.patch(
  '/admin/applications/:id',
  authRequired,
  requireRole('admin'),
  validateBody(updateStatusBody),
  adminCtrl.updateStatus,
);

export { router as ngoRouter };

