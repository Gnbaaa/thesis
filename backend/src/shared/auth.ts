import type { NextFunction, Request, Response } from 'express';
import { ForbiddenError, UnauthorizedError } from './errors';
import { verifyAccessToken } from '../modules/auth/auth.jwt';

function readBearer(req: Request): string | null {
  const raw = req.headers.authorization;
  if (!raw) return null;
  const m = raw.match(/^Bearer\s+(.+)$/i);
  return m?.[1]?.trim() ? m[1].trim() : null;
}

export function authRequired(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = readBearer(req);
    if (!token) {
      next(new UnauthorizedError());
      return;
    }
    req.user = verifyAccessToken(token);
    next();
  } catch {
    next(new UnauthorizedError());
  }
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

