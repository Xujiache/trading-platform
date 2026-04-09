import { FastifyReply } from 'fastify';

/**
 * 统一成功响应
 * @param reply - Fastify 响应对象
 * @param data - 响应数据
 * @param message - 响应消息
 * @param statusCode - HTTP 状态码
 */
export function success(reply: FastifyReply, data: unknown = null, message = 'success', statusCode = 200) {
  return reply.status(statusCode).send({
    code: 0,
    data,
    message,
  });
}

/**
 * 统一失败响应
 * @param reply - Fastify 响应对象
 * @param message - 错误消息
 * @param code - 业务错误码
 * @param statusCode - HTTP 状态码
 * @param errors - 详细错误信息
 */
export function fail(reply: FastifyReply, message: string, code = 1, statusCode = 400, errors?: unknown[]) {
  return reply.status(statusCode).send({
    code,
    message,
    ...(errors ? { errors } : {}),
  });
}

/**
 * 分页数据响应
 * @param reply - Fastify 响应对象
 * @param list - 数据列表
 * @param total - 总数
 * @param page - 当前页
 * @param limit - 每页数量
 */
export function paginate(reply: FastifyReply, list: unknown[], total: number, page: number, limit: number) {
  return reply.status(200).send({
    code: 0,
    data: {
      list,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
    message: 'success',
  });
}
