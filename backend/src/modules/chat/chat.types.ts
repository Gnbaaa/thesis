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

export type ChatMessageDto = {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  text: string;
  createdAt: string;
  readAt: string | null;
};

