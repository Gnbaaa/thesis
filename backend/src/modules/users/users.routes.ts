import { Router } from 'express';
import multer from 'multer';
import { authRequired } from '../../shared/auth';
import * as ctrl from './users.controller';

const router = Router();

router.get('/me', authRequired, ctrl.me);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});
router.post('/me/avatar', authRequired, upload.single('file'), ctrl.uploadAvatar);

export { router as usersRouter };

