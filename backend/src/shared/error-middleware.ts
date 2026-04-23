import type { NextFunction, Request, Response } from 'express';
import { AppError } from './errors';
import { logger } from './logger';

export function errorMiddleware(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    res.status(err.status).json({ error: err.toPayload() });
    return;
  }

  logger.error({ err }, 'unhandled_error');
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Серверийн алдаа гарлаа',
    },
  });
}

