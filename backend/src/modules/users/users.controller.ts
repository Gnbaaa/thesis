import type { Request, Response, NextFunction } from 'express';
import * as service from './users.service';
import { UnauthorizedError } from '../../shared/errors';

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new UnauthorizedError();
    const profile = await service.getMe(req.user.id);
    res.json(profile);
  } catch (err) {
    next(err);
  }
}

export async function uploadAvatar(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new UnauthorizedError();
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Зураг сонгоно уу' } });
      return;
    }
    const profile = await service.uploadMyAvatar({ userId: req.user.id, buffer: file.buffer });
    res.status(201).json(profile);
  } catch (err) {
    next(err);
  }
}

