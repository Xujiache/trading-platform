import { FastifyInstance } from 'fastify';
import { adminGuard } from '../../middlewares/adminGuard';
import { permissionGuard } from '../../middlewares/permissionGuard';
import * as adminController from './admin.controller';

/**
 * 管理端路由注册（含管理员自身、管理员管理、用户管理）
 * @param app - Fastify 实例
 */
export async function adminRoutes(app: FastifyInstance) {
  // 登录（无需认证）
  app.post('/auth/login', adminController.login);

  // 以下需要管理员认证
  app.register(async (authedApp) => {
    authedApp.addHook('preHandler', adminGuard);

    // 管理员自身
    authedApp.get('/auth/profile', adminController.getProfile);
    authedApp.put('/auth/password', adminController.changePassword);

    // 管理员管理
    authedApp.get('/admin', { preHandler: [permissionGuard('admin:view', 'admin:manage')] }, adminController.listAdmins);
    authedApp.post('/admin', { preHandler: [permissionGuard('admin:manage')] }, adminController.createAdmin);
    authedApp.put('/admin/:id', { preHandler: [permissionGuard('admin:manage')] }, adminController.updateAdmin);
    authedApp.put('/admin/:id/status', { preHandler: [permissionGuard('admin:manage')] }, adminController.updateAdminStatus);

    // 用户管理
    authedApp.get('/user', { preHandler: [permissionGuard('user:view', 'user:manage')] }, adminController.listUsers);
    authedApp.get('/user/:id', { preHandler: [permissionGuard('user:view', 'user:manage')] }, adminController.getUserDetail);
    authedApp.put('/user/:id/status', { preHandler: [permissionGuard('user:manage')] }, adminController.updateUserStatus);
    authedApp.put('/user/:id/reset-password', { preHandler: [permissionGuard('user:manage')] }, adminController.resetUserPassword);
    authedApp.get('/user/kyc/pending', { preHandler: [permissionGuard('user:manage')] }, adminController.getPendingKyc);
    authedApp.put('/user/kyc/:id/review', { preHandler: [permissionGuard('user:manage')] }, adminController.reviewKyc);
  });
}
