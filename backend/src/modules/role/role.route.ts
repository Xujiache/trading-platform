import { FastifyInstance } from 'fastify';
import { adminGuard } from '../../middlewares/adminGuard';
import { permissionGuard } from '../../middlewares/permissionGuard';
import * as roleController from './role.controller';

/**
 * 角色管理路由注册
 * 前缀: /api/admin/role
 * @param app - Fastify 实例
 */
export async function roleRoutes(app: FastifyInstance) {
  app.addHook('preHandler', adminGuard);

  app.get('/', { preHandler: [permissionGuard('role:view', 'role:manage')] }, roleController.list);
  app.post('/', { preHandler: [permissionGuard('role:manage')] }, roleController.create);
  app.put('/:id', { preHandler: [permissionGuard('role:manage')] }, roleController.update);
  app.delete('/:id', { preHandler: [permissionGuard('role:manage')] }, roleController.remove);
}
