import http from 'node:http';
import { Server } from 'socket.io';
import { logger } from '../shared/logger';
import { registerChatSocket } from './chat.socket';

function corsOrigins(): string[] {
  const raw = process.env.CORS_ORIGIN?.trim();
  if (raw) return raw.split(',').map((s) => s.trim()).filter(Boolean);
  if (process.env.NODE_ENV === 'production') {
    throw new Error('CORS_ORIGIN must be set in production');
  }
  return ['http://localhost:5173'];
}

export function attachSocket(server: http.Server): void {
  const origins = corsOrigins();
  const io = new Server(server, {
    cors: {
      origin: origins,
      credentials: true,
    },
  });

  registerChatSocket(io);

  io.engine.on('connection_error', (err) => {
    logger.warn({ err: { code: err.code, message: err.message } }, 'socket.connection_error');
  });
}

