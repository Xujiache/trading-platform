import { FastifyInstance } from 'fastify';
import { ChatController } from './chat.controller';
import { authGuard } from '../../middlewares/authGuard';
import { adminGuard } from '../../middlewares/adminGuard';

/**
 * 用户端客服路由
 * 前缀: /api/mobile/chat
 */
export async function chatRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authGuard);

  app.post('/session', ChatController.createSession);
  app.get('/messages', ChatController.getMessages);
}

/**
 * 管理端客服路由
 * 前缀: /api/admin/chat
 */
export async function adminChatRoutes(app: FastifyInstance) {
  app.addHook('preHandler', adminGuard);

  app.get('/sessions', ChatController.adminGetSessions);
  app.get('/sessions/:id/messages', ChatController.adminGetMessages);
  app.post('/sessions/:id/assign', ChatController.adminAssignSession);
  app.put('/sessions/:id/close', ChatController.adminCloseSession);
  app.get('/unread-count', ChatController.adminGetUnreadCount);
}
