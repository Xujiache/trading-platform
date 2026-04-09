import { FastifyInstance } from 'fastify';
import { authGuard } from '../../middlewares/authGuard';
import { adminGuard } from '../../middlewares/adminGuard';
import { permissionGuard } from '../../middlewares/permissionGuard';
import * as fundController from './fund.controller';

/**
 * 移动端资金模块路由
 * 前缀: /api/mobile/fund
 */
export async function fundRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authGuard);

  app.get('/overview', fundController.getOverview);
  app.post('/deposit', fundController.createDeposit);
  app.get('/deposit/records', fundController.getDepositRecords);
  app.post('/withdraw', fundController.createWithdraw);
  app.get('/withdraw/records', fundController.getWithdrawRecords);
  app.get('/flows', fundController.getFundFlows);
}

/**
 * 管理端资金模块路由
 * 前缀: /api/admin/fund
 */
export async function adminFundRoutes(app: FastifyInstance) {
  app.addHook('preHandler', adminGuard);

  app.get('/deposits', { preHandler: [permissionGuard('fund:view')] }, fundController.adminGetDeposits);
  app.put('/deposits/:id/review', { preHandler: [permissionGuard('fund:manage')] }, fundController.reviewDeposit);
  app.get('/withdraws', { preHandler: [permissionGuard('fund:view')] }, fundController.adminGetWithdraws);
  app.put('/withdraws/:id/review', { preHandler: [permissionGuard('fund:manage')] }, fundController.reviewWithdraw);
  app.put('/withdraws/:id/process', { preHandler: [permissionGuard('fund:manage')] }, fundController.processWithdraw);
  app.get('/flows', { preHandler: [permissionGuard('fund:view')] }, fundController.adminGetFlows);
  app.get('/statistics', { preHandler: [permissionGuard('fund:view')] }, fundController.getFinancialStats);
}
