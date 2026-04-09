import { FastifyInstance } from 'fastify';
import { authGuard } from '../../middlewares/authGuard';
import * as bankCardController from './bankCard.controller';

/**
 * 银行卡模块路由（归属资金模块前缀下）
 * 前缀: /api/mobile/fund
 */
export async function bankCardRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authGuard);

  app.get('/bank-cards', bankCardController.list);
  app.post('/bank-cards', bankCardController.add);
  app.delete('/bank-cards/:id', bankCardController.remove);
}
