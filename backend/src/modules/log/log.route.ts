import { FastifyInstance } from 'fastify';
import { LogController } from './log.controller';
import { adminGuard } from '../../middlewares/adminGuard';

/**
 * 管理端操作日志路由
 * 前缀: /api/admin/log
 */
export async function logRoutes(app: FastifyInstance) {
  app.addHook('preHandler', adminGuard);

  app.get('/', LogController.getList);
  app.get('/modules', LogController.getModules);
}
