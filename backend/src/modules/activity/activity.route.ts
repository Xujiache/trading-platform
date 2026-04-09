import { FastifyInstance } from 'fastify';
import { adminGuard } from '../../middlewares/adminGuard';
import { permissionGuard } from '../../middlewares/permissionGuard';
import * as ac from './activity.controller';

export async function activityRoutes(app: FastifyInstance) {
  app.addHook('preHandler', adminGuard);
  app.get('/', { preHandler: [permissionGuard('content:view')] }, ac.list);
  app.post('/', { preHandler: [permissionGuard('content:manage')] }, ac.create);
  app.put('/:id', { preHandler: [permissionGuard('content:manage')] }, ac.update);
  app.delete('/:id', { preHandler: [permissionGuard('content:manage')] }, ac.remove);
  app.put('/:id/status', { preHandler: [permissionGuard('content:manage')] }, ac.updateStatus);
  app.get('/:id/statistics', { preHandler: [permissionGuard('content:view')] }, ac.getStatistics);
}
