import { buildApp } from './app';
import { config } from './config';
import { prisma } from './config/database';
import { redis } from './config/redis';

/**
 * 启动服务器
 * 包含数据库连接检查、端口监听、优雅关闭
 */
async function start() {
  const app = await buildApp();

  // 数据库连接检查
  try {
    await prisma.$connect();
    app.log.info('[Database] Connected successfully');
  } catch (err) {
    app.log.error('[Database] Connection failed:', err);
    process.exit(1);
  }

  // 启动服务
  try {
    await app.listen({ port: config.port, host: config.host });
    app.log.info(`Server running at http://${config.host}:${config.port}`);
    app.log.info(`API docs: http://localhost:${config.port}/api/docs`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }

  // 优雅关闭
  const gracefulShutdown = async (signal: string) => {
    app.log.info(`Received ${signal}, starting graceful shutdown...`);

    const timeout = setTimeout(() => {
      app.log.error('Graceful shutdown timed out (10s), forcing exit');
      process.exit(1);
    }, 10000);

    try {
      await app.close();
      await prisma.$disconnect();
      await redis.quit();
      clearTimeout(timeout);
      app.log.info('Server closed gracefully');
      process.exit(0);
    } catch (err) {
      app.log.error('Error during shutdown:', err);
      clearTimeout(timeout);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

start();
