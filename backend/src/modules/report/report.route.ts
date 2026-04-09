import { FastifyInstance } from 'fastify';
import { authGuard } from '../../middlewares/authGuard';
import { adminGuard } from '../../middlewares/adminGuard';
import { permissionGuard } from '../../middlewares/permissionGuard';
import * as reportController from './report.controller';

/**
 * 移动端报表路由
 * 前缀: /api/mobile/report
 */
export async function reportRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authGuard);

  app.get('/trade', reportController.getTradeReport);
  app.get('/pnl', reportController.getPnlReport);
  app.get('/fee', reportController.getFeeReport);
}

/**
 * 管理端报表路由
 * 前缀: /api/admin/report
 */
export async function adminReportRoutes(app: FastifyInstance) {
  app.addHook('preHandler', adminGuard);

  app.get('/dashboard', { preHandler: [permissionGuard('report:view', '*')] }, reportController.getDashboard);
  app.get('/operation', { preHandler: [permissionGuard('report:view')] }, reportController.getOperationReport);
  app.get('/risk', { preHandler: [permissionGuard('report:view')] }, reportController.getRiskReport);
  app.get('/user-analysis', { preHandler: [permissionGuard('report:view')] }, reportController.getUserAnalysis);
}
