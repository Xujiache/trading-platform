import { FastifyRequest, FastifyReply } from 'fastify';
import { success } from '../../utils/response';
import * as marketService from './market.service';

/**
 * 获取品种列表
 */
export async function getSymbols(request: FastifyRequest, reply: FastifyReply) {
  const result = await marketService.getSymbols();
  return success(reply, result);
}

/**
 * 获取品种详情
 */
export async function getSymbolDetail(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const result = await marketService.getSymbolDetail(parseInt(id, 10));
  return success(reply, result);
}

/**
 * 获取 K 线数据
 */
export async function getKline(request: FastifyRequest, reply: FastifyReply) {
  const { symbolId, period, limit } = request.query as { symbolId: string; period: string; limit?: string };
  const result = await marketService.getKlineData(
    parseInt(symbolId, 10),
    period || '1m',
    parseInt(limit || '200', 10)
  );
  return success(reply, result);
}
