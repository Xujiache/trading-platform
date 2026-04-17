const http = require('http');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const config = require('./config');
const { testConnection: testDB } = require('./config/database');
const { testConnection: testRedis } = require('./config/redis');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { initDatabase } = require('./database/init');

const mobileAuthRoutes = require('./routes/mobile/auth');
const mobileHomepageRoutes = require('./routes/mobile/homepage');
const mobileContentRoutes = require('./routes/mobile/content');
const mobileMarketRoutes = require('./routes/mobile/market');
const mobileTradeRoutes = require('./routes/mobile/trade');
const mobileFundRoutes = require('./routes/mobile/fund');
const mobileReportRoutes = require('./routes/mobile/report');
const mobileUserRoutes = require('./routes/mobile/user');
const mobileRiskRoutes = require('./routes/mobile/risk');
const mobileNotificationRoutes = require('./routes/mobile/notification');
const mobileAnnouncementRoutes = require('./routes/mobile/announcement');
const mobileHelpRoutes = require('./routes/mobile/help');
const mobileTicketRoutes = require('./routes/mobile/ticket');
const mobileChatRoutes = require('./routes/mobile/chat');
const adminAuthRoutes = require('./routes/admin/auth');
const adminRoleRoutes = require('./routes/admin/roles');
const adminLogRoutes = require('./routes/admin/logs');
const adminConfigRoutes = require('./routes/admin/config');
const adminUploadRoutes = require('./routes/admin/upload');
const adminSymbolsRoutes = require('./routes/admin/symbols');
const adminTradeRoutes = require('./routes/admin/trade');
const adminFundRoutes = require('./routes/admin/fund');
const adminReportRoutes = require('./routes/admin/report');
const adminUsersRoutes = require('./routes/admin/users');
const adminRiskRoutes = require('./routes/admin/risk');
const adminNotificationRoutes = require('./routes/admin/notification');
const adminTicketRoutes = require('./routes/admin/ticket');
const adminChatRoutes = require('./routes/admin/chat');
const adminAdminsRoutes = require('./routes/admin/admins');
const adminOperationRoutes = require('./routes/admin/operation');
const adminSystemRoutes = require('./routes/admin/system');
const mobileOperationRoutes = require('./routes/mobile/operation');

const { loadSymbols, startPriceSimulation } = require('./services/marketDataService');
const { initWebSocket } = require('./services/websocketService');
const { startKlineService } = require('./services/klineService');
const { startMonitor } = require('./services/marketMonitorService');
const { startAlertService } = require('./services/alertService');
const { startForexFetcher } = require('./services/forexApiFetcher');
const { startGoldFetcher } = require('./services/goldApiFetcher');
const { startOilFetcher } = require('./services/oilApiFetcher');
const { startPendingOrderMonitor } = require('./services/pendingOrderMonitor');
const { startTrailingStopMonitor } = require('./services/trailingStopMonitor');
const { startFloatingPnlUpdater } = require('./services/floatingPnlUpdater');
const { startSwapSettlement } = require('./services/swapSettlement');
const customPriceEngine = require('./services/customPriceEngine');

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.get('/api/mobile/health', async (req, res) => {
  const health = { status: 'healthy', timestamp: new Date().toISOString(), services: {} };
  try {
    const conn = await require('./config/database').pool.getConnection();
    conn.release();
    health.services.database = 'up';
  } catch (_) {
    health.services.database = 'down';
    health.status = 'unhealthy';
  }
  try {
    const pong = await require('./config/redis').redis.ping();
    health.services.redis = pong === 'PONG' ? 'up' : 'down';
  } catch (_) {
    health.services.redis = 'down';
    if (health.status === 'healthy') health.status = 'degraded';
  }
  const { getMonitorStatus } = require('./services/marketMonitorService');
  health.services.market = getMonitorStatus().isHealthy ? 'up' : 'degraded';
  const httpCode = health.status === 'unhealthy' ? 503 : 200;
  res.status(httpCode).json({ code: httpCode, msg: 'OK', data: health });
});

app.use('/api/mobile/auth', mobileAuthRoutes);
app.use('/api/mobile/homepage', mobileHomepageRoutes);
app.use('/api/mobile/content', mobileContentRoutes);
app.use('/api/mobile/market', mobileMarketRoutes);
app.use('/api/mobile/trade', mobileTradeRoutes);
app.use('/api/mobile/fund', mobileFundRoutes);
app.use('/api/mobile/report', mobileReportRoutes);
app.use('/api/mobile/user', mobileUserRoutes);
app.use('/api/mobile/risk', mobileRiskRoutes);
app.use('/api/mobile/notification', mobileNotificationRoutes);
app.use('/api/mobile/announcement', mobileAnnouncementRoutes);
app.use('/api/mobile/help', mobileHelpRoutes);
app.use('/api/mobile/ticket', mobileTicketRoutes);
app.use('/api/mobile/chat', mobileChatRoutes);
app.use('/api/mobile/operation', mobileOperationRoutes);

app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin', adminRoleRoutes);
app.use('/api/admin', adminLogRoutes);
app.use('/api/admin', adminConfigRoutes);
app.use('/api/admin', adminUploadRoutes);
app.use('/api/admin', adminSymbolsRoutes);
app.use('/api/admin', adminTradeRoutes);
app.use('/api/admin', adminFundRoutes);
app.use('/api/admin', adminReportRoutes);
app.use('/api/admin', adminUsersRoutes);
app.use('/api/admin', adminRiskRoutes);
app.use('/api/admin', adminNotificationRoutes);
app.use('/api/admin', adminTicketRoutes);
app.use('/api/admin', adminChatRoutes);
app.use('/api/admin', adminAdminsRoutes);
app.use('/api/admin', adminOperationRoutes);
app.use('/api/admin', adminSystemRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

process.on('uncaughtException', (err) => {
  console.error(`[UncaughtException] ${new Date().toISOString()}`, err.stack || err);
  if (err.code === 'EADDRINUSE' || err.code === 'EACCES') {
    console.error('[Fatal] 端口冲突或权限不足，进程退出');
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(`[UnhandledRejection] ${new Date().toISOString()}`, reason);
});

async function startServer() {
  try {
    await initDatabase();
    const dbOk = await testDB();
    const redisOk = await testRedis();

    if (!dbOk) {
      console.error('数据库连接失败，服务无法启动');
      process.exit(1);
    }

    if (!redisOk) {
      console.warn('Redis 连接失败，部分功能可能不可用');
    }

    await loadSymbols();
    await customPriceEngine.start();
    startPriceSimulation(1000);
    startForexFetcher();
    startGoldFetcher();
    startOilFetcher();
    startKlineService(5000);
    startMonitor();
    startAlertService();
    startPendingOrderMonitor(2000);
    startTrailingStopMonitor(2000);
    startFloatingPnlUpdater(3000);
    startSwapSettlement();

    const server = http.createServer(app);
    initWebSocket(server);

    server.listen(config.port, () => {
      console.log(`\n========================================`);
      console.log(`  交易系统后端服务已启动`);
      console.log(`  环境: ${config.nodeEnv}`);
      console.log(`  端口: ${config.port}`);
      console.log(`  API:  http://localhost:${config.port}`);
      console.log(`  WS:   ws://localhost:${config.port}/ws/market`);
      console.log(`========================================\n`);
    });

    let isShuttingDown = false;
    const gracefulShutdown = async (signal) => {
      if (isShuttingDown) return;
      isShuttingDown = true;
      console.log(`\n收到 ${signal} 信号，正在优雅停机...`);

      const forceTimer = setTimeout(() => {
        console.error('[Shutdown] 超时，强制退出');
        process.exit(1);
      }, 15000);

      try {
        server.close(() => console.log('[Shutdown] HTTP 服务已关闭'));

        const { stopMonitor } = require('./services/marketMonitorService');
        stopMonitor();
        console.log('[Shutdown] 行情监控已停止');

        try {
          customPriceEngine.stop();
          console.log('[Shutdown] 自定义价格引擎已停止');
        } catch (e) { console.error('[Shutdown] 停止自定义价格引擎失败:', e.message); }

        try {
          const { pool: dbPool } = require('./config/database');
          await dbPool.end();
          console.log('[Shutdown] 数据库连接池已关闭');
        } catch (e) { console.error('[Shutdown] 关闭数据库连接池失败:', e.message); }

        try {
          const { redis: redisClient } = require('./config/redis');
          await redisClient.quit();
          console.log('[Shutdown] Redis 连接已关闭');
        } catch (e) { console.error('[Shutdown] 关闭 Redis 失败:', e.message); }

        clearTimeout(forceTimer);
        console.log('[Shutdown] 优雅停机完成');
        process.exit(0);
      } catch (err) {
        console.error('[Shutdown] 停机过程出错:', err.message);
        clearTimeout(forceTimer);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('服务启动失败:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
