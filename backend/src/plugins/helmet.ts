import helmet from '@fastify/helmet';
import { FastifyInstance } from 'fastify';

/**
 * 注册安全头插件，设置 HTTP 安全响应头
 * @param app - Fastify 实例
 */
export async function registerHelmet(app: FastifyInstance) {
  await app.register(helmet, {
    contentSecurityPolicy: false,
  });
}
