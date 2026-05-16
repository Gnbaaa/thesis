import { Router } from 'express';
import { authRequired, requireRole } from '../../shared/auth';
import { validateBody } from '../../shared/validate';
import { validateQuery } from '../../shared/validateQuery';
import { validateParams } from '../../shared/validateParams';
import {
  createDonationPostBody,
  donateBody,
  donationPostIdParams,
  listDonationPostsQuery,
  updateDonationPostBody,
} from './donations.schema';
import * as ctrl from './donations.controller';

const router = Router();

router.get('/', validateQuery(listDonationPostsQuery), ctrl.list);
router.get('/:id', validateParams(donationPostIdParams), ctrl.getById);
router.post(
  '/',
  authRequired,
  requireRole('ngo', 'admin'),
  validateBody(createDonationPostBody),
  ctrl.create,
);
router.patch(
  '/:id',
  authRequired,
  requireRole('ngo', 'admin'),
  validateParams(donationPostIdParams),
  validateBody(updateDonationPostBody),
  ctrl.update,
);
router.post(
  '/:id/donate',
  authRequired,
  validateParams(donationPostIdParams),
  validateBody(donateBody),
  ctrl.donate,
);

export { router as donationsRouter };
