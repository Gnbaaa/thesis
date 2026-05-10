import { io, type Socket } from 'socket.io-client';

export type ChatConversationListItem = {
  id: string;
  otherUser: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    role: string;
  };
  lastMessage: { text: string; createdAt: string } | null;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  text: string;
  createdAt: string;
  readAt: string | null;
};

type ServerToClientEvents = {
  'chat:message:new': (payload: { message: ChatMessage }) => void;
  'chat:seen': (payload: { conversationId: string; readerId: string; readAt: string }) => void;
};

type ClientToServerEvents = {
  'chat:conversations:list': (
    payload: { limit?: number },
    ack: (res: { ok: true; items: ChatConversationListItem[] } | { ok: false; message: string }) => void,
  ) => void;
  'chat:messages:list': (
    payload: { conversationId: string; limit?: number },
    ack: (res: { ok: true; items: ChatMessage[] } | { ok: false; message: string }) => void,
  ) => void;
  'chat:message:send': (
    payload: { recipientId: string; text: string },
    ack: (res: { ok: true; message: ChatMessage } | { ok: false; message: string }) => void,
  ) => void;
  'chat:seen': (
    payload: { conversationId: string },
    ack: (res: { ok: true } | { ok: false; message: string }) => void,
  ) => void;
};

let socketSingleton: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export function getChatSocket(): Socket<ServerToClientEvents, ClientToServerEvents> {
  if (socketSingleton) return socketSingleton;
  const baseURL = (process.env.VITE_API_URL ?? '').trim();
  socketSingleton = io(baseURL || undefined, {
    autoConnect: false,
    transports: ['websocket'],
    auth: { token: localStorage.getItem('accessToken') ?? '' },
  });
  return socketSingleton;
}

