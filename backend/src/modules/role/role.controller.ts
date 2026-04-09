import { FastifyRequest, FastifyReply } from 'fastify';
import { success, fail } from '../../utils/response';
import { createRoleSchema, updateRoleSchema } from './role.schema';
import * as roleService from './role.service';

/**
 * 角色列表
 */
export async function list(request: FastifyRequest, reply: FastifyReply) {
  const result = await roleService.list();
  return success(reply, result);
}

/**
 * 创建角色
 */
export async function create(request: FastifyRequest, reply: FastifyReply) {
  const parsed = createRoleSchema.safeParse(request.body);
  if (!parsed.success) {
    return fail(reply, '参数验证失败', 1022, 422, parsed.error.errors);
  }
  const result = await roleService.create(parsed.data);
  return success(reply, result, '创建成功', 201);
}

/**
 * 更新角色
 */
export async function update(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const parsed = updateRoleSchema.safeParse(request.body);
  if (!parsed.success) {
    return fail(reply, '参数验证失败', 1022, 422, parsed.error.errors);
  }
  const result = await roleService.update(parseInt(id, 10), parsed.data);
  return success(reply, result);
}

/**
 * 删除角色
 */
export async function remove(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const result = await roleService.remove(parseInt(id, 10));
  return success(reply, result);
}
