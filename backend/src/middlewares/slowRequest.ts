import { FastifyInstance } from 'fastify';

/**
 * 慢请求监控插件
 * 记录响应时间超过 1 秒的请求，用于性能监控
 * @param app - Fastify 实例
 */
export function registerSlowRequestMonitor(app: FastifyInstance) {
  app.addHook('onResponse', async (request, reply) => {
    const responseTime = reply.elapsedTime;

    if (responseTime > 1000) {
      app.log.warn({
        msg: '慢请求检测',
        method: request.method,
        url: request.url,
        responseTime: `${responseTime.toFixed(0)}ms`,
        ip: request.ip,
      });
    }
  });
}
