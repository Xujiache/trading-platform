import rateLimit from '@fastify/rate-limit';
import { FastifyInstance } from 'fastify';
import { redis } from '../config/redis';

/**
 * 注册全局限流插件
 * 默认每分钟 100 次请求；登录接口单独 5 次/分钟
 * @param app - Fastify 实例
 */
export async function registerRateLimit(app: FastifyInstance) {
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    redis,
    keyGenerator: (request) => {
      return request.ip;
    },
  });
}
