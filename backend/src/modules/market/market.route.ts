import { FastifyInstance } from 'fastify';
import * as marketController from './market.controller';

/**
 * 行情模块路由注册
 * 前缀: /api/mobile/market
 * @param app - Fastify 实例
 */
export async function marketRoutes(app: FastifyInstance) {
  app.get('/symbols', marketController.getSymbols);
  app.get('/symbols/:id', marketController.getSymbolDetail);
  app.get('/kline', marketController.getKline);
}
