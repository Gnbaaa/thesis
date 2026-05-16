import './loadEnv';
import express, { Request, Response } from 'express';
import http from 'node:http';
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
import { petsRouter } from './modules/pets/pets.routes';
import { adoptionRouter } from './modules/adoption/adoption.routes';
import { chatRouter } from './modules/chat/chat.routes';
import { notificationsRouter } from './modules/notifications/notifications.routes';
import { volunteerRouter } from './modules/volunteer/volunteer.routes';
import { donationsRouter } from './modules/donations/donations.routes';
import { webhook as donationsWebhook } from './modules/donations/donations.controller';
import { errorMiddleware } from './shared/error-middleware';
import { connectMongo } from './infra/mongo/connection';
import { attachSocket } from './realtime/socket';

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

// Stripe webhook нь raw body шаардлагатай учир express.json-ийн ӨМНӨ мountлогдоно.
// Signature шалгалт `payment.adapter.verifyWebhook` дотор хийгдэнэ (NFR-S, FR-9).
app.post(
  '/api/v1/donations/webhook',
  express.raw({ type: 'application/json' }),
  (req, res, next) => {
    Promise.resolve(donationsWebhook(req, res)).catch(next);
  },
);

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
app.use('/api/v1/pets', petsRouter);
app.use('/api/v1/adoption', adoptionRouter);
app.use('/api/v1/chat', chatRouter);
app.use('/api/v1/notifications', notificationsRouter);
app.use('/api/v1/volunteer', volunteerRouter);
app.use('/api/v1/donations', donationsRouter);

app.use(errorMiddleware);

if (require.main === module) {
  connectMongo()
    .then(() => {
      const server = http.createServer(app);
      attachSocket(server);
      server.listen(PORT, () => {
        logger.info(
          { port: PORT, googleOAuthConfigured: googleOAuthIsConfigured() },
          'server.started',
        );
      });
    })
    .catch((err) => {
      logger.error({ err }, 'mongo.connect_failed');
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      }
      const server = http.createServer(app);
      attachSocket(server);
      server.listen(PORT, () => {
        logger.info(
          { port: PORT, googleOAuthConfigured: googleOAuthIsConfigured(), mongo: 'disconnected' },
          'server.started',
        );
      });
    });
}

export { app };
