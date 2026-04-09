import Fastify from 'fastify';
import { config } from './config';
import { registerCors } from './plugins/cors';
import { registerHelmet } from './plugins/helmet';
import { registerRateLimit } from './plugins/rateLimit';
import { registerSwagger } from './plugins/swagger';
import { registerMultipart } from './plugins/multipart';
import { registerXssProtection } from './plugins/xss';
import { registerSlowRequestMonitor } from './middlewares/slowRequest';
import { AppError } from './utils/errors';

import { authRoutes } from './modules/auth/auth.route';
import { userRoutes } from './modules/user/user.route';
import { twoFactorRoutes } from './modules/twoFactor/twoFactor.route';
import { roleRoutes } from './modules/role/role.route';
import { adminRoutes } from './modules/admin/admin.route';
import { marketRoutes } from './modules/market/market.route';
import { alertRoutes } from './modules/alert/alert.route';
import { symbolRoutes, demoFeeRoutes } from './modules/symbol/symbol.route';
import { tradeRoutes } from './modules/trade/trade.route';
import { adminTradeRoutes } from './modules/trade/adminTrade.route';
import { fundRoutes, adminFundRoutes } from './modules/fund/fund.route';
import { bankCardRoutes } from './modules/bankCard/bankCard.route';
import { riskRoutes, adminRiskRoutes } from './modules/risk/risk.route';
import { reportRoutes, adminReportRoutes } from './modules/report/report.route';
import { notificationRoutes, adminNotificationRoutes } from './modules/notification/notification.route';
import { ticketRoutes, helpRoutes, adminTicketRoutes, adminAnnouncementRoutes } from './modules/ticket/ticket.route';
import { homepageRoutes, adminHomepageRoutes } from './modules/homepage/homepage.route';
import { activityRoutes } from './modules/activity/activity.route';
import { adminConfigRoutes } from './modules/config/config.route';
import { chatRoutes, adminChatRoutes } from './modules/chat/chat.route';
import { logRoutes } from './modules/log/log.route';
import { integrationRoutes } from './modules/integration/integration.route';
import { initSocketIO } from './plugins/socketio';
import { setupWebSocket } from './websocket';
import { marketEngine } from './services/marketEngine';
import { klineAggregator } from './services/klineAggregator';
import { startAllQueues } from './queues';

/**
 * 创建并配置 Fastify 应用实例
 * 注册所有插件、中间件和业务路由
 * @returns 配置好的 Fastify 实例
 */
export async function buildApp() {
  const app = Fastify({
    logger: {
      level: config.env === 'development' ? 'info' : 'warn',
      transport: config.env === 'development'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
    },
  });

  // 注册插件
  await registerCors(app);
  await registerHelmet(app);
  await registerRateLimit(app);
  await registerSwagger(app);
  await registerMultipart(app);

  // XSS 净化 + 慢请求监控
  registerXssProtection(app);
  registerSlowRequestMonitor(app);

  // 全局错误处理
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        code: error.code,
        message: error.message,
      });
    }

    // Zod 验证错误
    if (error.validation) {
      return reply.status(422).send({
        code: 1022,
        message: '参数验证失败',
        errors: error.validation,
      });
    }

    // 限流错误
    if (error.statusCode === 429) {
      return reply.status(429).send({
        code: 1029,
        message: '请求过于频繁，请稍后再试',
      });
    }

    app.log.error(error);
    return reply.status(500).send({
      code: 5000,
      message: '服务器内部错误',
    });
  });

  // 注册移动端路由
  app.register(authRoutes, { prefix: '/api/mobile/auth' });
  app.register(userRoutes, { prefix: '/api/mobile/user' });
  app.register(twoFactorRoutes, { prefix: '/api/mobile/two-factor' });
  app.register(marketRoutes, { prefix: '/api/mobile/market' });
  app.register(alertRoutes, { prefix: '/api/mobile/alert' });
  app.register(tradeRoutes, { prefix: '/api/mobile/trade' });
  app.register(fundRoutes, { prefix: '/api/mobile/fund' });
  app.register(bankCardRoutes, { prefix: '/api/mobile/fund' });
  app.register(riskRoutes, { prefix: '/api/mobile/risk' });
  app.register(reportRoutes, { prefix: '/api/mobile/report' });
  app.register(notificationRoutes, { prefix: '/api/mobile/notification' });
  app.register(ticketRoutes, { prefix: '/api/mobile/ticket' });
  app.register(helpRoutes, { prefix: '/api/mobile/help' });
  app.register(homepageRoutes, { prefix: '/api/mobile/homepage' });
  app.register(chatRoutes, { prefix: '/api/mobile/chat' });

  // 注册管理端路由
  app.register(roleRoutes, { prefix: '/api/admin/role' });
  app.register(adminRoutes, { prefix: '/api/admin' });
  app.register(symbolRoutes, { prefix: '/api/admin/symbol' });
  app.register(demoFeeRoutes, { prefix: '/api/admin/demo-fee' });
  app.register(adminTradeRoutes, { prefix: '/api/admin/trade' });
  app.register(adminFundRoutes, { prefix: '/api/admin/fund' });
  app.register(adminRiskRoutes, { prefix: '/api/admin/risk' });
  app.register(adminReportRoutes, { prefix: '/api/admin/report' });
  app.register(adminNotificationRoutes, { prefix: '/api/admin/notification' });
  app.register(adminAnnouncementRoutes, { prefix: '/api/admin/notification' });
  app.register(adminTicketRoutes, { prefix: '/api/admin/ticket' });
  app.register(adminHomepageRoutes, { prefix: '/api/admin/homepage' });
  app.register(activityRoutes, { prefix: '/api/admin/activity' });
  app.register(adminConfigRoutes, { prefix: '/api/admin/config' });
  app.register(adminChatRoutes, { prefix: '/api/admin/chat' });
  app.register(logRoutes, { prefix: '/api/admin/log' });
  app.register(integrationRoutes, { prefix: '/api/admin/integration' });

  // 健康检查
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  // Socket.IO + 行情引擎（需在 listen 后调用）
  app.addHook('onReady', async () => {
    const io = initSocketIO(app);
    setupWebSocket(io);
    marketEngine.start();

    marketEngine.onTick((tick) => {
      klineAggregator.updateTick(tick.symbol, tick.last, '1');
    });

    await startAllQueues();
  });

  return app;
}
