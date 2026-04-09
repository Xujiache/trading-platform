import { FastifyRequest, FastifyReply } from 'fastify';
import { success, fail, paginate } from '../../utils/response';
import { createOrderSchema, modifyOrderSchema, estimateSchema, pendingOrderSchema } from './trade.schema';
import * as tradeService from './trade.service';

export async function createOrder(request: FastifyRequest, reply: FastifyReply) {
  const parsed = createOrderSchema.safeParse(request.body);
  if (!parsed.success) return fail(reply, '参数验证失败', 1022, 422, parsed.error.errors);
  const result = await tradeService.createOrder(request.currentUser!.id, parsed.data);
  return success(reply, result, '下单成功', 201);
}

export async function closeOrder(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const result = await tradeService.closeOrder(request.currentUser!.id, parseInt(id, 10));
  return success(reply, result);
}

export async function closeAll(request: FastifyRequest, reply: FastifyReply) {
  const result = await tradeService.closeAll(request.currentUser!.id);
  return success(reply, result);
}

export async function modifyOrder(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const parsed = modifyOrderSchema.safeParse(request.body);
  if (!parsed.success) return fail(reply, '参数验证失败', 1022, 422, parsed.error.errors);
  const result = await tradeService.modifyOrder(request.currentUser!.id, parseInt(id, 10), parsed.data);
  return success(reply, result);
}

export async function getPositions(request: FastifyRequest, reply: FastifyReply) {
  const result = await tradeService.getPositions(request.currentUser!.id);
  return success(reply, result);
}

export async function getOrders(request: FastifyRequest, reply: FastifyReply) {
  const query = request.query as { status?: string; page?: number; limit?: number };
  const result = await tradeService.getOrders(request.currentUser!.id, query);
  return paginate(reply, result.list, result.total, result.page, result.limit);
}

export async function getOrderDetail(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const result = await tradeService.getOrderDetail(request.currentUser!.id, parseInt(id, 10));
  return success(reply, result);
}

export async function getAccount(request: FastifyRequest, reply: FastifyReply) {
  const result = await tradeService.getAccountInfo(request.currentUser!.id);
  return success(reply, result);
}

export async function estimate(request: FastifyRequest, reply: FastifyReply) {
  const parsed = estimateSchema.safeParse(request.body);
  if (!parsed.success) return fail(reply, '参数验证失败', 1022, 422, parsed.error.errors);
  const result = await tradeService.estimateFees(parsed.data);
  return success(reply, result);
}

export async function getPendingOrders(request: FastifyRequest, reply: FastifyReply) {
  const result = await tradeService.getPendingOrders(request.currentUser!.id);
  return success(reply, result);
}

export async function createPendingOrder(request: FastifyRequest, reply: FastifyReply) {
  const parsed = pendingOrderSchema.safeParse(request.body);
  if (!parsed.success) return fail(reply, '参数验证失败', 1022, 422, parsed.error.errors);
  const result = await tradeService.createPendingOrder(request.currentUser!.id, parsed.data);
  return success(reply, result, '挂单创建成功', 201);
}

export async function cancelPendingOrder(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const result = await tradeService.cancelPendingOrder(request.currentUser!.id, parseInt(id, 10));
  return success(reply, result);
}
