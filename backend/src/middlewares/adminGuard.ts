import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken } from '../utils/crypto';
import { UnauthorizedError } from '../utils/errors';
import { prisma } from '../config/database';

/**
 * 管理端 JWT 认证守卫（preHandler 钩子）
 * 验证管理员 Token 并加载角色权限信息
 * @param request - Fastify 请求对象
 * @param reply - Fastify 响应对象
 */
export async function adminGuard(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('请先登录管理后台');
  }

  const token = authHeader.substring(7);

  try {
    const payload = await verifyToken(token, 'admin');

    const admin = await prisma.admin.findUnique({
      where: { id: payload.id },
      include: { role: true },
    });

    if (!admin || admin.status !== 1) {
      throw new UnauthorizedError('管理员账号已禁用');
    }

    request.currentAdmin = {
      id: admin.id,
      type: 'admin',
      roleId: admin.roleId,
      permissions: admin.role.permissions as string[],
    };
  } catch (err) {
    if (err instanceof UnauthorizedError) throw err;
    throw new UnauthorizedError('管理员登录已过期');
  }
}
