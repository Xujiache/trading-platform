import { FastifyInstance } from 'fastify';
import { authGuard } from '../../middlewares/authGuard';
import * as alertController from './alert.controller';

/**
 * 预警模块路由注册
 * 前缀: /api/mobile/alert
 * @param app - Fastify 实例
 */
export async function alertRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authGuard);

  app.get('/', alertController.list);
  app.post('/', alertController.create);
  app.put('/:id', alertController.update);
  app.delete('/:id', alertController.remove);
}
