import { Router } from 'express';
import multer from 'multer';
import { authRequired } from '../../shared/auth';
import * as ctrl from './uploads.controller';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post('/', authRequired, upload.single('file'), ctrl.uploadSingle);

export { router as uploadsRouter };

