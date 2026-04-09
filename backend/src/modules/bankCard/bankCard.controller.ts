import { FastifyRequest, FastifyReply } from 'fastify';
import { success, fail } from '../../utils/response';
import { addBankCardSchema } from './bankCard.schema';
import * as bankCardService from './bankCard.service';

export async function list(request: FastifyRequest, reply: FastifyReply) {
  const result = await bankCardService.list(request.currentUser!.id);
  return success(reply, result);
}

export async function add(request: FastifyRequest, reply: FastifyReply) {
  const parsed = addBankCardSchema.safeParse(request.body);
  if (!parsed.success) return fail(reply, '参数验证失败', 1022, 422, parsed.error.errors);
  const result = await bankCardService.add(request.currentUser!.id, parsed.data);
  return success(reply, result, '银行卡添加成功', 201);
}

export async function remove(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const result = await bankCardService.remove(request.currentUser!.id, parseInt(id, 10));
  return success(reply, result);
}
