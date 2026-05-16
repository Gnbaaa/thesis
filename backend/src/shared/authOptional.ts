import type { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../modules/auth/auth.jwt';
import { findUserAccountStatusById } from '../modules/auth/auth.repository';
import { assertUserMayAuthenticate } from '../modules/auth/userStatus';
import { AppError } from './errors';

function readBearer(req: Request): string | null {
  const raw = req.headers.authorization;
  if (!raw) return null;
  const m = raw.match(/^Bearer\s+(.+)$/i);
  return m?.[1]?.trim() ? m[1].trim() : null;
}

/** Valid Bearer token байвал req.user тохируулна; түдгэлзсэн/хаагдсан бол anonymous үлдэнэ. */
export function authOptional(req: Request, _res: Response, next: NextFunction) {
  void (async () => {
    try {
      const token = readBearer(req);
      if (!token) {
        next();
        return;
      }
      const user = verifyAccessToken(token);
      const status = await findUserAccountStatusById(user.id);
      if (!status) {
        next();
        return;
      }
      try {
        assertUserMayAuthenticate(status);
      } catch (err) {
        if (err instanceof AppError && err.status === 403) {
          next();
          return;
        }
        throw err;
      }
      req.user = { ...user, status };
      next();
    } catch {
      next();
    }
  })();
}
