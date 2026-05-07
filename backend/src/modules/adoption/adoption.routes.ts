import { Router } from 'express';
import { authRequired } from '../../shared/auth';
import { validateBody } from '../../shared/validate';
import { validateQuery } from '../../shared/validateQuery';
import { validateParams } from '../../shared/validateParams';
import { createAdoptionRequestBody, inboxQuery, requestIdParams, resolveBody } from './adoption.schema';
import * as ctrl from './adoption.controller';

const router = Router();

router.post('/requests', authRequired, validateBody(createAdoptionRequestBody), ctrl.create);
router.get('/inbox', authRequired, validateQuery(inboxQuery), ctrl.inbox);
router.get('/my-requests', authRequired, validateQuery(inboxQuery), ctrl.myRequests);
router.get('/requests/:id', authRequired, validateParams(requestIdParams), ctrl.getDetail);
router.post('/requests/:id/resolve', authRequired, validateParams(requestIdParams), validateBody(resolveBody), ctrl.resolve);

export { router as adoptionRouter };

