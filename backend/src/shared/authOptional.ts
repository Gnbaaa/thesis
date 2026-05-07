import type { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../modules/auth/auth.jwt';

function readBearer(req: Request): string | null {
  const raw = req.headers.authorization;
  if (!raw) return null;
  const m = raw.match(/^Bearer\s+(.+)$/i);
  return m?.[1]?.trim() ? m[1].trim() : null;
}

/** If a valid Bearer token exists, sets req.user; otherwise continues anonymously. */
export function authOptional(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = readBearer(req);
    if (!token) {
      next();
      return;
    }
    req.user = verifyAccessToken(token);
    next();
  } catch {
    next();
  }
}

