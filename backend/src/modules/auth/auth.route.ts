import { FastifyInstance } from 'fastify';
import * as authController from './auth.controller';

/**
 * 认证模块路由注册
 * 前缀: /api/mobile/auth
 * @param app - Fastify 实例
 */
export async function authRoutes(app: FastifyInstance) {
  app.post('/register', authController.register);
  app.post('/login', authController.login);
  app.post('/send-code', authController.sendCode);
  app.post('/forgot-password', authController.forgotPassword);
  app.post('/refresh-token', authController.refreshToken);
}
