import { FastifyRequest, FastifyReply } from 'fastify';
import { success, fail, paginate } from '../../utils/response';
import { riskAssessmentSchema, processAlertSchema } from './risk.schema';
import * as riskService from './risk.service';

// ==================== 用户端 ====================

export async function submitAssessment(request: FastifyRequest, reply: FastifyReply) {
  const parsed = riskAssessmentSchema.safeParse(request.body);
  if (!parsed.success) return fail(reply, '参数验证失败', 1022, 422, parsed.error.errors);
  const result = await riskService.submitAssessment(request.currentUser!.id, parsed.data);
  return success(reply, result);
}

export async function getAssessment(request: FastifyRequest, reply: FastifyReply) {
  const result = await riskService.getAssessment(request.currentUser!.id);
  return success(reply, result);
}

export async function getRiskStatus(request: FastifyRequest, reply: FastifyReply) {
  const result = await riskService.getRiskStatus(request.currentUser!.id);
  return success(reply, result);
}

// ==================== 管理端 ====================

export async function getRiskConfig(request: FastifyRequest, reply: FastifyReply) {
  const result = await riskService.getRiskConfig();
  return success(reply, result);
}

export async function updateRiskConfig(request: FastifyRequest, reply: FastifyReply) {
  const configs = request.body as Array<{ configKey: string; configValue: string; description?: string }>;
  const result = await riskService.updateRiskConfig(configs);
  return success(reply, result);
}

export async function getAlerts(request: FastifyRequest, reply: FastifyReply) {
  const query = request.query as { page?: number; limit?: number; status?: string; alertType?: string };
  const result = await riskService.getAlerts(query);
  return paginate(reply, result.list, result.total, result.page, result.limit);
}

export async function processAlert(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const parsed = processAlertSchema.safeParse(request.body);
  if (!parsed.success) return fail(reply, '参数验证失败', 1022, 422, parsed.error.errors);
  const result = await riskService.processAlert(parseInt(id, 10), request.currentAdmin!.id, parsed.data);
  return success(reply, result);
}

export async function getForceCloseRecords(request: FastifyRequest, reply: FastifyReply) {
  const query = request.query as { page?: number; limit?: number };
  const result = await riskService.getForceCloseRecords(query);
  return paginate(reply, result.list, result.total, result.page, result.limit);
}

export async function getHighRiskAccounts(request: FastifyRequest, reply: FastifyReply) {
  const result = await riskService.getHighRiskAccounts();
  return success(reply, result);
}
