import { FastifyInstance } from 'fastify';
import { adminGuard } from '../../middlewares/adminGuard';
import { permissionGuard } from '../../middlewares/permissionGuard';
import * as hc from './homepage.controller';

/** 用户端首页路由 /api/mobile/homepage */
export async function homepageRoutes(app: FastifyInstance) {
  app.get('/banners', hc.getBanners);
  app.get('/reward-cards', hc.getRewardCards);
  app.get('/announcements', hc.getAnnouncements);
  app.get('/hot-symbols', hc.getHotSymbols);
}

/** 管理端首页运营路由 /api/admin/homepage */
export async function adminHomepageRoutes(app: FastifyInstance) {
  app.addHook('preHandler', adminGuard);

  app.get('/banners', { preHandler: [permissionGuard('content:view')] }, hc.adminBannerList);
  app.post('/banners', { preHandler: [permissionGuard('content:manage')] }, hc.createBanner);
  app.put('/banners/:id', { preHandler: [permissionGuard('content:manage')] }, hc.updateBanner);
  app.delete('/banners/:id', { preHandler: [permissionGuard('content:manage')] }, hc.deleteBanner);

  app.get('/reward-cards', { preHandler: [permissionGuard('content:view')] }, hc.adminRewardCardList);
  app.post('/reward-cards', { preHandler: [permissionGuard('content:manage')] }, hc.createRewardCard);
  app.put('/reward-cards/:id', { preHandler: [permissionGuard('content:manage')] }, hc.updateRewardCard);
  app.delete('/reward-cards/:id', { preHandler: [permissionGuard('content:manage')] }, hc.deleteRewardCard);
}
