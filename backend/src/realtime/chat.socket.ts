import type { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../modules/auth/auth.jwt';
import * as chatService from '../modules/chat/chat.service';
import * as usersService from '../modules/users/users.service';
import { logger } from '../shared/logger';
import * as notificationsService from '../modules/notifications/notifications.service';
import * as chatRepo from '../modules/chat/chat.repository';

type ClientToServerEvents = {
  'chat:conversations:list': (payload: { limit?: number }, ack: (res: { ok: true; items: unknown[] } | { ok: false; message: string }) => void) => void;
  'chat:messages:list': (
    payload: { conversationId: string; limit?: number },
    ack: (res: { ok: true; items: unknown[] } | { ok: false; message: string }) => void,
  ) => void;
  'chat:message:send': (
    payload: { recipientId: string; text: string },
    ack: (res: { ok: true; message: unknown } | { ok: false; message: string }) => void,
  ) => void;
  'chat:seen': (
    payload: { conversationId: string },
    ack: (res: { ok: true } | { ok: false; message: string }) => void,
  ) => void;
};

type ServerToClientEvents = {
  'chat:message:new': (payload: { message: unknown }) => void;
  'chat:seen': (payload: { conversationId: string; readerId: string; readAt: string }) => void;
};

type SocketData = { userId: string };

function roomForUser(userId: string): string {
  return `user:${userId}`;
}

function readBearer(authHeader?: string): string | null {
  if (!authHeader) return null;
  const m = authHeader.match(/^Bearer\s+(.+)$/i);
  const tok = m?.[1]?.trim();
  return tok ? tok : null;
}

export function registerChatSocket(io: Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>) {
  io.use((socket, next) => {
    try {
      const fromHeader = readBearer(socket.handshake.headers.authorization);
      const fromAuth =
        typeof socket.handshake.auth?.token === 'string' ? socket.handshake.auth.token.trim() : null;
      const token = fromHeader ?? fromAuth;
      if (!token) {
        next(new Error('Нэвтрэх шаардлагатай'));
        return;
      }
      const user = verifyAccessToken(token);
      socket.data.userId = user.id;
      next();
    } catch {
      next(new Error('Token хүчингүй байна'));
    }
  });

  io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>) => {
    const userId = socket.data.userId;
    socket.join(roomForUser(userId));

    socket.on('chat:conversations:list', async (payload, ack) => {
      try {
        const limit = Math.min(Math.max(Number(payload?.limit ?? 30), 1), 100);
        const items = await chatService.listConversations({ userId, limit });
        ack({ ok: true, items });
      } catch {
        ack({ ok: false, message: 'Чатын жагсаалт ачаалж чадсангүй.' });
      }
    });

    socket.on('chat:messages:list', async (payload, ack) => {
      try {
        const conversationId = String(payload?.conversationId ?? '').trim();
        if (!conversationId) {
          ack({ ok: false, message: 'conversationId буруу байна.' });
          return;
        }
        const limit = Math.min(Math.max(Number(payload?.limit ?? 50), 1), 100);
        const data = await chatService.listMessages({ conversationId, userId, limit });
        ack({ ok: true, items: data.items });
      } catch {
        ack({ ok: false, message: 'Зурвасууд ачаалж чадсангүй.' });
      }
    });

    socket.on('chat:message:send', async (payload, ack) => {
      try {
        const recipientId = String(payload?.recipientId ?? '').trim();
        const text = String(payload?.text ?? '').trim();
        if (!recipientId) {
          ack({ ok: false, message: 'Хүлээн авагч буруу байна.' });
          return;
        }
        if (!text) {
          ack({ ok: false, message: 'Зурвасаа бичнэ үү.' });
          return;
        }
        if (text.length > 4000) {
          ack({ ok: false, message: 'Зурвас хэт урт байна.' });
          return;
        }

        // validate recipient exists (avoid ghost chats)
        await usersService.getPublicProfileById(recipientId);
        const msg = await chatService.sendMessage({ senderId: userId, recipientId, text });

        try {
          const senderProfile = await usersService.getPublicProfileById(userId);
          await notificationsService.notifySafe({
            userId: recipientId,
            type: 'chat_message',
            title: 'Шинэ чат ирсэн',
            body: `${senderProfile.displayName} танд зурвас илгээсэн.`,
            actionLabel: 'Чат үзэх',
            actionUrl: `/chat?to=${encodeURIComponent(userId)}`,
            sourceId: msg.id,
          });
        } catch (err) {
          logger.warn({ err }, 'socket.notification_create_failed');
        }

        io.to(roomForUser(userId)).emit('chat:message:new', { message: msg });
        io.to(roomForUser(recipientId)).emit('chat:message:new', { message: msg });
        ack({ ok: true, message: msg });
      } catch (err) {
        logger.warn({ err }, 'socket.chat_send_failed');
        ack({ ok: false, message: 'Зурвас илгээж чадсангүй.' });
      }
    });

    socket.on('chat:seen', async (payload, ack) => {
      try {
        const conversationId = String(payload?.conversationId ?? '').trim();
        if (!conversationId) {
          ack({ ok: false, message: 'conversationId буруу байна.' });
          return;
        }
        const seen = await chatService.markSeen({ conversationId, readerId: userId });
        const otherUserId = chatRepo.otherUserIdFromConversationId(conversationId, userId);
        if (otherUserId) {
          io.to(roomForUser(otherUserId)).emit('chat:seen', seen);
        }
        ack({ ok: true });
      } catch (err) {
        logger.warn({ err }, 'socket.chat_seen_failed');
        ack({ ok: false, message: 'Seen шинэчилж чадсангүй.' });
      }
    });
  });
}

