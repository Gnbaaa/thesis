import { Router } from 'express';
import { authRequired, requireRole } from '../../shared/auth';
import { authOptional } from '../../shared/authOptional';
import { validateBody } from '../../shared/validate';
import { validateQuery } from '../../shared/validateQuery';
import { validateParams } from '../../shared/validateParams';
import {
  createVolunteerPostBody,
  listVolunteerPostsQuery,
  updateVolunteerPostBody,
  volunteerPostIdParams,
} from './volunteer.schema';
import * as ctrl from './volunteer.controller';

const router = Router();

router.get('/', validateQuery(listVolunteerPostsQuery), ctrl.list);
router.get('/:id', authOptional, validateParams(volunteerPostIdParams), ctrl.getById);
router.post(
  '/',
  authRequired,
  requireRole('ngo', 'admin'),
  validateBody(createVolunteerPostBody),
  ctrl.create,
);
router.patch(
  '/:id',
  authRequired,
  requireRole('ngo', 'admin'),
  validateParams(volunteerPostIdParams),
  validateBody(updateVolunteerPostBody),
  ctrl.update,
);
router.post(
  '/:id/register',
  authRequired,
  validateParams(volunteerPostIdParams),
  ctrl.register,
);
router.delete(
  '/:id/register',
  authRequired,
  validateParams(volunteerPostIdParams),
  ctrl.unregister,
);

export { router as volunteerRouter };
