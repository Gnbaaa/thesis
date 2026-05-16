import type { NextFunction, Request, Response } from 'express';
import { AppError, ForbiddenError, UnauthorizedError } from './errors';
import { verifyAccessToken } from '../modules/auth/auth.jwt';
import { findUserAccountStatusById } from '../modules/auth/auth.repository';
import { assertUserMayAuthenticate } from '../modules/auth/userStatus';

function readBearer(req: Request): string | null {
  const raw = req.headers.authorization;
  if (!raw) return null;
  const m = raw.match(/^Bearer\s+(.+)$/i);
  return m?.[1]?.trim() ? m[1].trim() : null;
}

/**
 * Bearer JWT шалгана. Дараа нь DB-ээс `users.status`-ийг уншиж түдгэлзсэн/хаагдсан
 * эсэхийг шалгана — admin түдгэлзүүлмэгц хуучин token шууд хүчингүй болно.
 */
export function authRequired(req: Request, _res: Response, next: NextFunction) {
  void (async () => {
    try {
      const token = readBearer(req);
      if (!token) {
        next(new UnauthorizedError());
        return;
      }
      const user = verifyAccessToken(token);
      const status = await findUserAccountStatusById(user.id);
      if (!status) {
        next(new UnauthorizedError());
        return;
      }
      assertUserMayAuthenticate(status);
      req.user = { ...user, status };
      next();
    } catch (err) {
      if (err instanceof AppError) {
        next(err);
        return;
      }
      next(new UnauthorizedError());
    }
  })();
}

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(new UnauthorizedError());
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(new ForbiddenError());
      return;
    }
    next();
  };
}
