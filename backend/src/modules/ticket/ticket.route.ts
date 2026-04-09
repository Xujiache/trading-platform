import { FastifyInstance } from 'fastify';
import { authGuard } from '../../middlewares/authGuard';
import { adminGuard } from '../../middlewares/adminGuard';
import { permissionGuard } from '../../middlewares/permissionGuard';
import * as tc from './ticket.controller';

/** 用户端工单路由 /api/mobile/ticket */
export async function ticketRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authGuard);
  app.get('/', tc.userList);
  app.post('/', tc.create);
  app.get('/:id', tc.detail);
  app.post('/:id/reply', tc.userReply);
}

/** 用户端帮助文档 /api/mobile/help （无需认证） */
export async function helpRoutes(app: FastifyInstance) {
  app.get('/', tc.helpList);
}

/** 管理端工单+帮助+公告路由 /api/admin/ticket */
export async function adminTicketRoutes(app: FastifyInstance) {
  app.addHook('preHandler', adminGuard);
  app.get('/', { preHandler: [permissionGuard('ticket:view')] }, tc.adminList);
  app.post('/:id/reply', { preHandler: [permissionGuard('ticket:manage')] }, tc.adminReply);
  app.put('/:id/close', { preHandler: [permissionGuard('ticket:manage')] }, tc.closeTicket);
  app.put('/:id/assign', { preHandler: [permissionGuard('ticket:manage')] }, tc.assignTicket);
  app.get('/help', { preHandler: [permissionGuard('content:view')] }, tc.adminHelpList);
  app.post('/help', { preHandler: [permissionGuard('content:manage')] }, tc.createHelp);
  app.put('/help/:id', { preHandler: [permissionGuard('content:manage')] }, tc.updateHelp);
  app.delete('/help/:id', { preHandler: [permissionGuard('content:manage')] }, tc.deleteHelp);
}

/** 管理端公告路由 /api/admin/notification */
export async function adminAnnouncementRoutes(app: FastifyInstance) {
  app.addHook('preHandler', adminGuard);
  app.get('/announcements', { preHandler: [permissionGuard('content:view')] }, tc.adminAnnouncementList);
  app.post('/announcements', { preHandler: [permissionGuard('content:manage')] }, tc.createAnnouncement);
  app.put('/announcements/:id', { preHandler: [permissionGuard('content:manage')] }, tc.updateAnnouncement);
  app.delete('/announcements/:id', { preHandler: [permissionGuard('content:manage')] }, tc.deleteAnnouncement);
}
