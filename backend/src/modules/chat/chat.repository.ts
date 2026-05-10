import mongoose, { Schema } from 'mongoose';
import { connectMongo } from '../../infra/mongo/connection';

type ChatMessageDoc = {
  conversationId: string;
  senderId: string;
  recipientId: string;
  text: string;
  createdAt: Date;
  readAt?: Date | null;
};

const ChatMessageSchema = new Schema<ChatMessageDoc>(
  {
    conversationId: { type: String, required: true, index: true },
    senderId: { type: String, required: true, index: true },
    recipientId: { type: String, required: true, index: true },
    text: { type: String, required: true },
    createdAt: { type: Date, required: true, default: () => new Date(), index: true },
    readAt: { type: Date, required: false, default: null },
  },
  {
    collection: 'chat_messages',
  },
);

ChatMessageSchema.index({ conversationId: 1, createdAt: -1 });

const ChatMessageModel =
  (mongoose.models.ChatMessage as mongoose.Model<ChatMessageDoc> | undefined) ??
  mongoose.model<ChatMessageDoc>('ChatMessage', ChatMessageSchema);

function conversationIdFor(a: string, b: string): string {
  const [x, y] = [a.trim(), b.trim()].sort();
  return `${x}__${y}`;
}

function participantsFromConversationId(id: string): [string, string] | null {
  const parts = id.split('__');
  if (parts.length !== 2) return null;
  if (!parts[0] || !parts[1]) return null;
  return [parts[0], parts[1]];
}

export async function listConversationIdsForUser(userId: string, limit: number): Promise<string[]> {
  await connectMongo();
  const rows = await ChatMessageModel.aggregate<{ _id: string }>([
    {
      $match: {
        $or: [{ senderId: userId }, { recipientId: userId }],
      },
    },
    { $sort: { createdAt: -1 } },
    { $group: { _id: '$conversationId', lastAt: { $first: '$createdAt' } } },
    { $sort: { lastAt: -1 } },
    { $limit: limit },
  ]);
  return rows.map((r) => r._id);
}

export async function getLastMessageForConversation(conversationId: string): Promise<ChatMessageDoc | null> {
  await connectMongo();
  return ChatMessageModel.findOne({ conversationId }).sort({ createdAt: -1 }).lean<ChatMessageDoc>().exec();
}

export async function listMessagesForConversation(params: {
  conversationId: string;
  userId: string;
  limit: number;
}): Promise<Array<ChatMessageDoc & { _id: mongoose.Types.ObjectId }>> {
  await connectMongo();
  const parts = participantsFromConversationId(params.conversationId);
  if (!parts || !parts.includes(params.userId)) return [];
  return ChatMessageModel.find({ conversationId: params.conversationId })
    .sort({ createdAt: -1 })
    .limit(params.limit)
    .lean<Array<ChatMessageDoc & { _id: mongoose.Types.ObjectId }>>()
    .exec();
}

export async function createMessage(params: {
  senderId: string;
  recipientId: string;
  text: string;
}): Promise<ChatMessageDoc & { _id: mongoose.Types.ObjectId }> {
  await connectMongo();
  const doc = await ChatMessageModel.create({
    conversationId: conversationIdFor(params.senderId, params.recipientId),
    senderId: params.senderId,
    recipientId: params.recipientId,
    text: params.text.trim(),
    createdAt: new Date(),
    readAt: null,
  });
  const plain = doc.toObject() as ChatMessageDoc & { _id: mongoose.Types.ObjectId };
  return plain;
}

export async function markConversationRead(params: {
  conversationId: string;
  readerId: string;
}): Promise<{ updated: number; readAt: Date }> {
  await connectMongo();
  const parts = participantsFromConversationId(params.conversationId);
  if (!parts || !parts.includes(params.readerId)) return { updated: 0, readAt: new Date() };
  const now = new Date();
  const res = await ChatMessageModel.updateMany(
    { conversationId: params.conversationId, recipientId: params.readerId, readAt: null },
    { $set: { readAt: now } },
  ).exec();
  return { updated: res.modifiedCount ?? 0, readAt: now };
}

export function otherUserIdFromConversationId(conversationId: string, me: string): string | null {
  const parts = participantsFromConversationId(conversationId);
  if (!parts) return null;
  if (parts[0] === me) return parts[1];
  if (parts[1] === me) return parts[0];
  return null;
}

export function makeConversationId(a: string, b: string): string {
  return conversationIdFor(a, b);
}

