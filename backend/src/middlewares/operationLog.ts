import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../config/database';

const SENSITIVE_FIELDS = ['password', 'passwordHash', 'newPassword', 'oldPassword', 'twoFactorSecret', 'token', 'accessToken', 'refreshToken'];

/**
 * 过滤请求体中的敏感字段，防止密码等信息泄露到日志
 */
function sanitizeLogBody(body: unknown): unknown {
  if (!body || typeof body !== 'object') return body;
  const sanitized = { ...(body as Record<string, unknown>) };
  for (const key of SENSITIVE_FIELDS) {
    if (key in sanitized) sanitized[key] = '***REDACTED***';
  }
  return sanitized;
}

/**
 * 管理端操作日志记录（onResponse 钩子）
 * 记录所有修改类操作（POST/PUT/DELETE）到操作日志表
 * @param module - 操作模块名称
 * @param action - 操作类型描述
 */
export function operationLog(module: string, action: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.currentAdmin) return;

    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
      try {
        const params = request.params as Record<string, unknown>;
        await prisma.operationLog.create({
          data: {
            adminId: request.currentAdmin.id,
            module,
            action,
            targetType: module,
            targetId: params?.id ? parseInt(params.id as string, 10) : undefined,
            detail: {
              method: request.method,
              url: request.url,
              body: sanitizeLogBody(request.body),
            } as any,
            ip: request.ip,
            userAgent: request.headers['user-agent'] || '',
          },
        });
      } catch {
        // 日志记录失败不影响主流程
      }
    }
  };
}
