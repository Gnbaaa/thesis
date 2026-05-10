import { Router } from 'express';
import { authRequired } from '../../shared/auth';
import { validateQuery } from '../../shared/validateQuery';
import { validateParams } from '../../shared/validateParams';
import { validateBody } from '../../shared/validate';
import * as controller from './chat.controller';
import {
  conversationParamsSchema,
  listConversationsQuerySchema,
  listMessagesQuerySchema,
  sendMessageBodySchema,
} from './chat.schema';

export const chatRouter = Router();

chatRouter.get('/conversations', authRequired, validateQuery(listConversationsQuerySchema), controller.listConversations);
chatRouter.get(
  '/conversations/:id/messages',
  authRequired,
  validateParams(conversationParamsSchema),
  validateQuery(listMessagesQuerySchema),
  controller.listMessages,
);
chatRouter.post(
  '/conversations/:id/messages',
  authRequired,
  validateParams(conversationParamsSchema),
  validateBody(sendMessageBodySchema),
  controller.sendMessage,
);

