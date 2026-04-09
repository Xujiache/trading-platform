import { FastifyInstance } from 'fastify';
import { IntegrationController } from './integration.controller';
import { adminGuard } from '../../middlewares/adminGuard';

/**
 * 管理端第三方接口路由
 * 前缀: /api/admin/integration
 */
export async function integrationRoutes(app: FastifyInstance) {
  app.addHook('preHandler', adminGuard);

  app.get('/', IntegrationController.getList);
  app.put('/:id', IntegrationController.update);
  app.post('/:id/test', IntegrationController.testConnection);
}
