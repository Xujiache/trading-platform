import { FastifyInstance } from 'fastify';
import { authGuard } from '../../middlewares/authGuard';
import * as userController from './user.controller';

/**
 * 用户模块路由注册
 * 前缀: /api/mobile/user
 * @param app - Fastify 实例
 */
export async function userRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authGuard);

  app.get('/profile', userController.getProfile);
  app.put('/profile', userController.updateProfile);
  app.put('/password', userController.changePassword);
  app.post('/avatar', userController.uploadAvatar);
  app.post('/kyc', userController.submitKyc);
  app.get('/kyc/status', userController.getKycStatus);
}
