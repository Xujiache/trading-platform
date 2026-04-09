import { FastifyRequest, FastifyReply } from 'fastify';
import { success, fail } from '../../utils/response';
import { updateSymbolSchema, feeTierSchema } from './symbol.schema';
import * as symbolService from './symbol.service';

export async function list(request: FastifyRequest, reply: FastifyReply) {
  const result = await symbolService.list();
  return success(reply, result);
}

export async function update(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const parsed = updateSymbolSchema.safeParse(request.body);
  if (!parsed.success) return fail(reply, '参数验证失败', 1022, 422, parsed.error.errors);
  const result = await symbolService.update(parseInt(id, 10), parsed.data);
  return success(reply, result);
}

export async function updateStatus(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const { status } = request.body as { status: number };
  const result = await symbolService.updateStatus(parseInt(id, 10), status);
  return success(reply, result);
}

export async function getFeeTiers(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const result = await symbolService.getFeeTiers(parseInt(id, 10));
  return success(reply, result);
}

export async function createFeeTier(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const parsed = feeTierSchema.safeParse({ ...(request.body as object), symbolId: parseInt(id, 10) });
  if (!parsed.success) return fail(reply, '参数验证失败', 1022, 422, parsed.error.errors);
  const result = await symbolService.createFeeTier(parsed.data);
  return success(reply, result, '创建成功', 201);
}

export async function deleteFeeTier(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const result = await symbolService.deleteFeeTier(parseInt(id, 10));
  return success(reply, result);
}

export async function getDemoFeeList(request: FastifyRequest, reply: FastifyReply) {
  const result = await symbolService.getDemoFeeList();
  return success(reply, result);
}

export async function updateDemoFee(request: FastifyRequest, reply: FastifyReply) {
  const { symbolId } = request.params as { symbolId: string };
  const result = await symbolService.updateDemoFee(parseInt(symbolId, 10), request.body as Record<string, unknown>);
  return success(reply, result);
}
