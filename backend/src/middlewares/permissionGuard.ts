import { FastifyRequest, FastifyReply } from 'fastify';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';

/**
 * RBAC 权限检查守卫工厂函数
 * 生成一个 preHandler 钩子，检查当前管理员是否具有指定权限
 * @param requiredPermissions - 所需的权限标识数组（满足其一即可）
 * @returns Fastify preHandler 钩子函数
 */
export function permissionGuard(...requiredPermissions: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const admin = request.currentAdmin;

    if (!admin) {
      throw new UnauthorizedError('请先登录管理后台');
    }

    if (admin.permissions.includes('*')) {
      return;
    }

    const hasPermission = requiredPermissions.some((p) => admin.permissions.includes(p));

    if (!hasPermission) {
      throw new ForbiddenError(`需要权限: ${requiredPermissions.join(' 或 ')}`);
    }
  };
}
