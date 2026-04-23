import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';
import { ValidationError } from './errors';

export function validateBody(schema: ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const first = result.error.issues[0];
      const msg = first?.message ?? 'Оруулга буруу байна';
      next(new ValidationError(msg));
      return;
    }
    req.body = result.data;
    next();
  };
}

