import { FastifyInstance } from 'fastify';
import { adminGuard } from '../../middlewares/adminGuard';
import { permissionGuard } from '../../middlewares/permissionGuard';
import * as cc from './config.controller';

export async function adminConfigRoutes(app: FastifyInstance) {
  app.addHook('preHandler', adminGuard);

  app.get('/', { preHandler: [permissionGuard('*')] }, cc.list);
  app.put('/', { preHandler: [permissionGuard('*')] }, cc.batchUpdate);
  app.get('/smtp', { preHandler: [permissionGuard('*')] }, cc.getSmtpConfig);
  app.put('/smtp', { preHandler: [permissionGuard('*')] }, cc.updateSmtpConfig);
}
