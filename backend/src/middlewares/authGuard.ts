import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken } from '../utils/crypto';
import { UnauthorizedError } from '../utils/errors';

/**
 * 移动端 JWT 认证守卫（preHandler 钩子）
 * 从 Authorization 头中提取 Bearer Token 并验证
 * @param request - Fastify 请求对象
 * @param reply - Fastify 响应对象
 */
export async function authGuard(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('请先登录');
  }

  const token = authHeader.substring(7);

  try {
    const payload = await verifyToken(token, 'mobile');
    request.currentUser = {
      id: payload.id,
      type: 'mobile',
    };
  } catch {
    throw new UnauthorizedError('登录已过期，请重新登录');
  }
}
