import { FastifyInstance } from 'fastify';
import { adminGuard } from '../../middlewares/adminGuard';
import { permissionGuard } from '../../middlewares/permissionGuard';
import * as adminTradeController from './adminTrade.controller';

/**
 * 管理端交易管理路由
 * 前缀: /api/admin/trade
 * @param app - Fastify 实例
 */
export async function adminTradeRoutes(app: FastifyInstance) {
  app.addHook('preHandler', adminGuard);

  app.get('/orders', { preHandler: [permissionGuard('trade:view')] }, adminTradeController.getOrders);
  app.get('/positions', { preHandler: [permissionGuard('trade:view')] }, adminTradeController.getPositions);
  app.post('/force-close/:id', { preHandler: [permissionGuard('trade:manage')] }, adminTradeController.forceClose);
  app.get('/statistics', { preHandler: [permissionGuard('trade:view')] }, adminTradeController.getStatistics);
}
