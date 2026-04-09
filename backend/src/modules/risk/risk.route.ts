import { FastifyInstance } from 'fastify';
import { authGuard } from '../../middlewares/authGuard';
import { adminGuard } from '../../middlewares/adminGuard';
import { permissionGuard } from '../../middlewares/permissionGuard';
import * as riskController from './risk.controller';

/**
 * 用户端风控路由
 * 前缀: /api/mobile/risk
 */
export async function riskRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authGuard);

  app.post('/assessment', riskController.submitAssessment);
  app.get('/assessment', riskController.getAssessment);
  app.get('/status', riskController.getRiskStatus);
}

/**
 * 管理端风控路由
 * 前缀: /api/admin/risk
 */
export async function adminRiskRoutes(app: FastifyInstance) {
  app.addHook('preHandler', adminGuard);

  app.get('/config', { preHandler: [permissionGuard('risk:view')] }, riskController.getRiskConfig);
  app.put('/config', { preHandler: [permissionGuard('risk:manage')] }, riskController.updateRiskConfig);
  app.get('/alerts', { preHandler: [permissionGuard('risk:view')] }, riskController.getAlerts);
  app.put('/alerts/:id/process', { preHandler: [permissionGuard('risk:manage')] }, riskController.processAlert);
  app.get('/force-close', { preHandler: [permissionGuard('risk:view')] }, riskController.getForceCloseRecords);
  app.get('/high-risk', { preHandler: [permissionGuard('risk:view')] }, riskController.getHighRiskAccounts);
}
