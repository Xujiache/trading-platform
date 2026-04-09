import { FastifyInstance } from 'fastify';

/**
 * XSS 请求净化插件
 * 递归清理请求 body 中的 HTML 标签和危险字符
 * @param app - Fastify 实例
 */
export function registerXssProtection(app: FastifyInstance) {
  app.addHook('preHandler', async (request) => {
    if (request.body && typeof request.body === 'object') {
      request.body = sanitizeObject(request.body as Record<string, unknown>);
    }
  });
}

function sanitizeString(str: string): string {
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

function sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = sanitizeString(value);
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        typeof item === 'string' ? sanitizeString(item) :
        typeof item === 'object' && item !== null ? sanitizeObject(item as Record<string, unknown>) : item
      );
    } else if (typeof value === 'object' && value !== null) {
      result[key] = sanitizeObject(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result;
}
