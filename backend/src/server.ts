import './loadEnv';
import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import pinoHttp from 'pino-http';
import passport from 'passport';
import { logger } from './shared/logger';
import { googleOAuthIsConfigured } from './modules/auth/oauth.adapter';
import { authRouter } from './modules/auth/auth.routes';
import { uploadsRouter } from './modules/uploads/uploads.routes';
import { usersRouter } from './modules/users/users.routes';
import { ngoRouter } from './modules/ngo/ngo.routes';
import { errorMiddleware } from './shared/error-middleware';

const app = express();
const PORT = Number(process.env.PORT) || 4000;

function corsOrigins(): string[] {
  const raw = process.env.CORS_ORIGIN?.trim();
  if (raw) {
    return raw.split(',').map((s) => s.trim()).filter(Boolean);
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('CORS_ORIGIN must be set in production');
  }
  return ['http://localhost:5173'];
}

app.use(helmet());
app.use(cors({ origin: corsOrigins(), credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(pinoHttp({ logger }));
app.use(passport.initialize());

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/uploads', uploadsRouter);
app.use('/api/v1/ngo', ngoRouter);

app.use(errorMiddleware);

if (require.main === module) {
  app.listen(PORT, () => {
    logger.info(
      { port: PORT, googleOAuthConfigured: googleOAuthIsConfigured() },
      'server.started',
    );
  });
}

export { app };
