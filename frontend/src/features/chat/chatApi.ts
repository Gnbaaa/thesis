import { api } from '@/lib/api';

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
};

export async function listConversations(params: { limit?: number } = {}): Promise<{ items: ChatConversationListItem[] }> {
  const { data } = await api.get<{ items: ChatConversationListItem[] }>('/api/v1/chat/conversations', {
    params: { limit: params.limit ?? 20 },
  });
  return data;
}

export async function listMessages(params: { conversationId: string; limit?: number }): Promise<{ items: ChatMessage[] }> {
  const { data } = await api.get<{ items: ChatMessage[] }>(
    `/api/v1/chat/conversations/${encodeURIComponent(params.conversationId)}/messages`,
    { params: { limit: params.limit ?? 30 } },
  );
  return data;
}

export async function sendMessage(params: {
  conversationId: string;
  recipientId: string;
  text: string;
}): Promise<ChatMessage> {
  const { data } = await api.post<ChatMessage>(
    `/api/v1/chat/conversations/${encodeURIComponent(params.conversationId)}/messages`,
    { recipientId: params.recipientId, text: params.text },
  );
  return data;
}

