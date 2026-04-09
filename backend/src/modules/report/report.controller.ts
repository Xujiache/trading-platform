import { FastifyRequest, FastifyReply } from 'fastify';
import { success } from '../../utils/response';
import * as reportService from './report.service';

// ==================== 移动端 ====================

export async function getTradeReport(request: FastifyRequest, reply: FastifyReply) {
  const query = request.query as { startDate?: string; endDate?: string };
  const result = await reportService.getUserTradeReport(request.currentUser!.id, query);
  return success(reply, result);
}

export async function getPnlReport(request: FastifyRequest, reply: FastifyReply) {
  const result = await reportService.getUserPnlReport(request.currentUser!.id);
  return success(reply, result);
}

export async function getFeeReport(request: FastifyRequest, reply: FastifyReply) {
  const result = await reportService.getUserFeeReport(request.currentUser!.id);
  return success(reply, result);
}

// ==================== 管理端 ====================

export async function getDashboard(request: FastifyRequest, reply: FastifyReply) {
  const result = await reportService.getDashboardData();
  return success(reply, result);
}

export async function getOperationReport(request: FastifyRequest, reply: FastifyReply) {
  const query = request.query as { startDate?: string; endDate?: string };
  const result = await reportService.getOperationReport(query);
  return success(reply, result);
}

export async function getRiskReport(request: FastifyRequest, reply: FastifyReply) {
  const result = await reportService.getRiskReport();
  return success(reply, result);
}

export async function getUserAnalysis(request: FastifyRequest, reply: FastifyReply) {
  const result = await reportService.getUserAnalysis();
  return success(reply, result);
}
