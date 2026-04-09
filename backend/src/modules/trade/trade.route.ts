import { FastifyInstance } from 'fastify';
import { authGuard } from '../../middlewares/authGuard';
import * as tradeController from './trade.controller';

/**
 * 交易模块路由注册
 * 前缀: /api/mobile/trade
 * @param app - Fastify 实例
 */
export async function tradeRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authGuard);

  app.post('/order', tradeController.createOrder);
  app.post('/close/:id', tradeController.closeOrder);
  app.post('/close-all', tradeController.closeAll);
  app.put('/order/:id', tradeController.modifyOrder);
  app.get('/positions', tradeController.getPositions);
  app.get('/orders', tradeController.getOrders);
  app.get('/orders/:id', tradeController.getOrderDetail);
  app.get('/account', tradeController.getAccount);
  app.post('/estimate', tradeController.estimate);
  app.get('/pending', tradeController.getPendingOrders);
  app.post('/pending', tradeController.createPendingOrder);
  app.delete('/pending/:id', tradeController.cancelPendingOrder);
}
