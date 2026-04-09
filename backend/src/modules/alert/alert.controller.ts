import { FastifyRequest, FastifyReply } from 'fastify';
import { success, fail } from '../../utils/response';
import { createAlertSchema, updateAlertSchema } from './alert.schema';
import * as alertService from './alert.service';

export async function list(request: FastifyRequest, reply: FastifyReply) {
  const result = await alertService.list(request.currentUser!.id);
  return success(reply, result);
}

export async function create(request: FastifyRequest, reply: FastifyReply) {
  const parsed = createAlertSchema.safeParse(request.body);
  if (!parsed.success) return fail(reply, '参数验证失败', 1022, 422, parsed.error.errors);
  const result = await alertService.create(request.currentUser!.id, parsed.data);
  return success(reply, result, '创建成功', 201);
}

export async function update(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const parsed = updateAlertSchema.safeParse(request.body);
  if (!parsed.success) return fail(reply, '参数验证失败', 1022, 422, parsed.error.errors);
  const result = await alertService.update(request.currentUser!.id, parseInt(id, 10), parsed.data);
  return success(reply, result);
}

export async function remove(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const result = await alertService.remove(request.currentUser!.id, parseInt(id, 10));
  return success(reply, result);
}
