import type { Request, Response } from 'express';
import * as service from './chat.service';

export async function listConversations(req: Request, res: Response) {
  const q = (req as Request & { validatedQuery?: unknown }).validatedQuery as { limit: number };
  const userId = req.user!.id;
  const items = await service.listConversations({ userId, limit: q.limit });
  res.json({ items });
}

export async function listMessages(req: Request, res: Response) {
  const p = (req as Request & { validatedParams?: unknown }).validatedParams as { id: string };
  const q = (req as Request & { validatedQuery?: unknown }).validatedQuery as { limit: number };
  const userId = req.user!.id;
  const data = await service.listMessages({ conversationId: p.id, userId, limit: q.limit });
  res.json(data);
}

export async function sendMessage(req: Request, res: Response) {
  const p = (req as Request & { validatedParams?: unknown }).validatedParams as { id: string };
  const body = req.body as { text: string; recipientId: string };
  const userId = req.user!.id;

  // `:id` is kept for REST shape; actual conversation id is derived from participants.
  const msg = await service.sendMessage({ senderId: userId, recipientId: body.recipientId, text: body.text });
  if (msg.conversationId !== p.id) {
    res.status(201).json({ ...msg, conversationId: msg.conversationId });
    return;
  }
  res.status(201).json(msg);
}

