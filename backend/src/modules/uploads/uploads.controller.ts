import type { Request, Response, NextFunction } from 'express';
import * as service from './uploads.service';
import { ValidationError } from '../../shared/errors';

export async function uploadSingle(req: Request, res: Response, next: NextFunction) {
  try {
    const file = req.file;
    if (!file) {
      throw new ValidationError('Файл сонгоно уу');
    }
    const folder = typeof req.body?.folder === 'string' && req.body.folder.trim() ? req.body.folder.trim() : 'uploads';
    const result = await service.uploadImage({ buffer: file.buffer, folder });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

