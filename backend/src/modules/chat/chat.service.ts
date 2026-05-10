import * as repo from './chat.repository';
import * as usersService from '../users/users.service';
import type { ChatConversationListItem, ChatMessageDto } from './chat.types';

function toIso(d: Date): string {
  return d.toISOString();
}

export async function listConversations(params: {
  userId: string;
  limit: number;
}): Promise<ChatConversationListItem[]> {
  const ids = await repo.listConversationIdsForUser(params.userId, params.limit);
  if (!ids.length) return [];

  const otherIds = ids
    .map((id) => repo.otherUserIdFromConversationId(id, params.userId))
    .filter((v): v is string => Boolean(v));

  const users = await usersService.getPublicProfilesByIds(otherIds);
  const userById = new Map(users.map((u) => [u.id, u]));

  const out: ChatConversationListItem[] = [];
  for (const id of ids) {
    const otherId = repo.otherUserIdFromConversationId(id, params.userId);
    const other = otherId ? userById.get(otherId) : null;
    if (!other) continue;
    const last = await repo.getLastMessageForConversation(id);
    out.push({
      id,
      otherUser: other,
      lastMessage: last ? { text: last.text, createdAt: toIso(last.createdAt) } : null,
    });
  }
  return out;
}

export async function listMessages(params: {
  conversationId: string;
  userId: string;
  limit: number;
}): Promise<{ items: ChatMessageDto[] }> {
  const docs = await repo.listMessagesForConversation(params);
  const items = docs
    .map((d) => ({
      id: d._id.toString(),
      conversationId: d.conversationId,
      senderId: d.senderId,
      recipientId: d.recipientId,
      text: d.text,
      createdAt: toIso(d.createdAt),
      readAt: d.readAt ? toIso(d.readAt) : null,
    }))
    .reverse(); // oldest -> newest
  return { items };
}

export async function sendMessage(params: {
  senderId: string;
  recipientId: string;
  text: string;
}): Promise<ChatMessageDto> {
  const created = await repo.createMessage(params);
  return {
    id: created._id.toString(),
    conversationId: created.conversationId,
    senderId: created.senderId,
    recipientId: created.recipientId,
    text: created.text,
    createdAt: toIso(created.createdAt),
    readAt: created.readAt ? toIso(created.readAt) : null,
  };
}

export async function markSeen(params: { conversationId: string; readerId: string }): Promise<{ conversationId: string; readerId: string; readAt: string }> {
  const res = await repo.markConversationRead({ conversationId: params.conversationId, readerId: params.readerId });
  return { conversationId: params.conversationId, readerId: params.readerId, readAt: toIso(res.readAt) };
}

