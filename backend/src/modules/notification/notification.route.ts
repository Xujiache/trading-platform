import { FastifyInstance } from 'fastify';
import { authGuard } from '../../middlewares/authGuard';
import { adminGuard } from '../../middlewares/adminGuard';
import { permissionGuard } from '../../middlewares/permissionGuard';
import * as notifController from './notification.controller';

export async function notificationRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authGuard);
  app.get('/', notifController.list);
  app.put('/:id/read', notifController.markRead);
  app.put('/read-all', notifController.markAllRead);
  app.get('/unread-count', notifController.getUnreadCount);
}

export async function adminNotificationRoutes(app: FastifyInstance) {
  app.addHook('preHandler', adminGuard);
  app.get('/', { preHandler: [permissionGuard('content:view')] }, notifController.adminList);
  app.post('/', { preHandler: [permissionGuard('content:manage')] }, notifController.adminSend);
}
