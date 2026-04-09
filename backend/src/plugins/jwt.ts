import { FastifyInstance } from 'fastify';
import { generateToken, verifyToken } from '../utils/crypto';

/**
 * JWT 认证插件
 * 将 JWT 工具方法挂载到 Fastify 实例上
 * mobile 和 admin 使用不同密钥签发/验证
 * @param app - Fastify 实例
 */
export async function registerJwt(app: FastifyInstance) {
  app.decorate('jwt', {
    sign: generateToken,
    verify: verifyToken,
  });
}
