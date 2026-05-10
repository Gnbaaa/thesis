import { Router } from 'express';
import multer from 'multer';
import { authRequired } from '../../shared/auth';
import { validateParams } from '../../shared/validateParams';
import * as ctrl from './users.controller';
import { userIdParamsSchema } from './users.schema';

const router = Router();

router.get('/me', authRequired, ctrl.me);
router.get('/public/:id', authRequired, validateParams(userIdParamsSchema), ctrl.publicProfile);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});
router.post('/me/avatar', authRequired, upload.single('file'), ctrl.uploadAvatar);

export { router as usersRouter };

