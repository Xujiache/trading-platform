import { FastifyRequest, FastifyReply } from 'fastify';
import { success, fail, paginate } from '../../utils/response';
import { depositSchema, withdrawSchema, depositReviewSchema, withdrawReviewSchema } from './fund.schema';
import * as fundService from './fund.service';

// ==================== 移动端 ====================

export async function getOverview(request: FastifyRequest, reply: FastifyReply) {
  const result = await fundService.getOverview(request.currentUser!.id);
  return success(reply, result);
}

export async function createDeposit(request: FastifyRequest, reply: FastifyReply) {
  const parsed = depositSchema.safeParse(request.body);
  if (!parsed.success) return fail(reply, '参数验证失败', 1022, 422, parsed.error.errors);
  const result = await fundService.createDeposit(request.currentUser!.id, parsed.data);
  return success(reply, result, '入金申请已提交', 201);
}

export async function getDepositRecords(request: FastifyRequest, reply: FastifyReply) {
  const query = request.query as { page?: number; limit?: number };
  const result = await fundService.getDepositRecords(request.currentUser!.id, query);
  return paginate(reply, result.list, result.total, result.page, result.limit);
}

export async function createWithdraw(request: FastifyRequest, reply: FastifyReply) {
  const parsed = withdrawSchema.safeParse(request.body);
  if (!parsed.success) return fail(reply, '参数验证失败', 1022, 422, parsed.error.errors);
  const result = await fundService.createWithdraw(request.currentUser!.id, parsed.data);
  return success(reply, result, '出金申请已提交', 201);
}

export async function getWithdrawRecords(request: FastifyRequest, reply: FastifyReply) {
  const query = request.query as { page?: number; limit?: number };
  const result = await fundService.getWithdrawRecords(request.currentUser!.id, query);
  return paginate(reply, result.list, result.total, result.page, result.limit);
}

export async function getFundFlows(request: FastifyRequest, reply: FastifyReply) {
  const query = request.query as { type?: string; page?: number; limit?: number };
  const result = await fundService.getFundFlows(request.currentUser!.id, query);
  return paginate(reply, result.list, result.total, result.page, result.limit);
}

// ==================== 管理端 ====================

export async function adminGetDeposits(request: FastifyRequest, reply: FastifyReply) {
  const query = request.query as { page?: number; limit?: number; status?: string };
  const result = await fundService.adminGetDeposits(query);
  return paginate(reply, result.list, result.total, result.page, result.limit);
}

export async function reviewDeposit(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const parsed = depositReviewSchema.safeParse(request.body);
  if (!parsed.success) return fail(reply, '参数验证失败', 1022, 422, parsed.error.errors);
  const result = await fundService.reviewDeposit(parseInt(id, 10), request.currentAdmin!.id, parsed.data);
  return success(reply, result);
}

export async function adminGetWithdraws(request: FastifyRequest, reply: FastifyReply) {
  const query = request.query as { page?: number; limit?: number; status?: string };
  const result = await fundService.adminGetWithdraws(query);
  return paginate(reply, result.list, result.total, result.page, result.limit);
}

export async function reviewWithdraw(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const parsed = withdrawReviewSchema.safeParse(request.body);
  if (!parsed.success) return fail(reply, '参数验证失败', 1022, 422, parsed.error.errors);
  const result = await fundService.reviewWithdraw(parseInt(id, 10), request.currentAdmin!.id, parsed.data);
  return success(reply, result);
}

export async function processWithdraw(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const result = await fundService.processWithdraw(parseInt(id, 10), request.currentAdmin!.id);
  return success(reply, result);
}

export async function adminGetFlows(request: FastifyRequest, reply: FastifyReply) {
  const query = request.query as { page?: number; limit?: number };
  const { skip, take, page, limit } = await import('../../utils/helpers').then(m => m.parsePagination(query.page, query.limit));
  const [list, total] = await Promise.all([
    (await import('../../config/database')).prisma.fundFlow.findMany({ skip, take, orderBy: { createdAt: 'desc' } }),
    (await import('../../config/database')).prisma.fundFlow.count(),
  ]);
  return paginate(reply, list, total, page, limit);
}

export async function getFinancialStats(request: FastifyRequest, reply: FastifyReply) {
  const result = await fundService.getFinancialStats();
  return success(reply, result);
}
