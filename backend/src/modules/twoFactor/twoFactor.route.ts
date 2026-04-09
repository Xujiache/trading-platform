import { FastifyInstance } from 'fastify';
import { authGuard } from '../../middlewares/authGuard';
import * as twoFactorController from './twoFactor.controller';

/**
 * 2FA 两步验证模块路由注册
 * 前缀: /api/mobile/two-factor
 * @param app - Fastify 实例
 */
export async function twoFactorRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authGuard);

  app.post('/generate', twoFactorController.generate);
  app.post('/enable', twoFactorController.enable);
  app.post('/disable', twoFactorController.disable);
  app.post('/verify', twoFactorController.verify);
}
