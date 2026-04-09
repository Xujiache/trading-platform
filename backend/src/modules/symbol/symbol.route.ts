import { FastifyInstance } from 'fastify';
import { adminGuard } from '../../middlewares/adminGuard';
import { permissionGuard } from '../../middlewares/permissionGuard';
import * as symbolController from './symbol.controller';

/**
 * 品种管理路由注册（管理端）
 * 前缀: /api/admin/symbol 和 /api/admin/demo-fee
 * @param app - Fastify 实例
 */
export async function symbolRoutes(app: FastifyInstance) {
  app.addHook('preHandler', adminGuard);

  // 品种管理
  app.get('/', { preHandler: [permissionGuard('trade:view', 'trade:manage')] }, symbolController.list);
  app.put('/:id', { preHandler: [permissionGuard('trade:manage')] }, symbolController.update);
  app.put('/:id/status', { preHandler: [permissionGuard('trade:manage')] }, symbolController.updateStatus);
  app.get('/:id/fee-tiers', { preHandler: [permissionGuard('trade:view')] }, symbolController.getFeeTiers);
  app.post('/:id/fee-tiers', { preHandler: [permissionGuard('trade:manage')] }, symbolController.createFeeTier);
  app.delete('/fee-tiers/:id', { preHandler: [permissionGuard('trade:manage')] }, symbolController.deleteFeeTier);
}

/**
 * 模拟盘费用路由
 * 前缀: /api/admin/demo-fee
 */
export async function demoFeeRoutes(app: FastifyInstance) {
  app.addHook('preHandler', adminGuard);

  app.get('/', { preHandler: [permissionGuard('trade:view')] }, symbolController.getDemoFeeList);
  app.put('/:symbolId', { preHandler: [permissionGuard('trade:manage')] }, symbolController.updateDemoFee);
}
