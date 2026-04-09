import { FastifyRequest, FastifyReply } from 'fastify';
import { success, paginate } from '../../utils/response';
import { prisma } from '../../config/database';
import { TradeEngine } from '../../services/tradeEngine';
import { parsePagination } from '../../utils/helpers';
import { marketEngine } from '../../services/marketEngine';
import { FeeCalculator } from '../../services/feeCalculator';
import Decimal from 'decimal.js';

/**
 * 管理端订单列表
 */
export async function getOrders(request: FastifyRequest, reply: FastifyReply) {
  const query = request.query as { page?: number; limit?: number; status?: string };
  const { skip, take, page, limit } = parsePagination(query.page, query.limit);
  const where: Record<string, unknown> = {};
  if (query.status) where.status = query.status;

  const [list, total] = await Promise.all([
    prisma.tradeOrder.findMany({
      where,
      include: { symbol: { select: { symbol: true, name: true } } },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.tradeOrder.count({ where }),
  ]);

  return paginate(reply, list, total, page, limit);
}

/**
 * 管理端持仓列表
 */
export async function getPositions(request: FastifyRequest, reply: FastifyReply) {
  const positions = await prisma.tradeOrder.findMany({
    where: { status: 'open' },
    include: { symbol: { select: { symbol: true, name: true, contractUnit: true } } },
    orderBy: { openedAt: 'desc' },
  });

  const prices = await marketEngine.getCurrentPrice();
  const priceMap = new Map(prices.map((p) => [p.symbol, p]));

  const result = positions.map((p) => {
    const tick = priceMap.get(p.symbol.symbol);
    let floatingPnl = '0.00';
    if (tick) {
      const currentPrice = p.direction === 'buy' ? tick.bid : tick.ask;
      const pnl = FeeCalculator.calcFloatingPnl(
        p.direction,
        new Decimal(p.openPrice!.toString()),
        new Decimal(currentPrice),
        p.symbol.contractUnit,
        new Decimal(p.lots.toString())
      );
      floatingPnl = pnl.toFixed(2);
    }
    return { ...p, floatingPnl };
  });

  return success(reply, result);
}

/**
 * 管理端手动平仓
 */
export async function forceClose(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const order = await prisma.tradeOrder.findUnique({ where: { id: parseInt(id, 10) } });
  if (!order) return success(reply, null, '订单不存在');

  const result = await TradeEngine.closeOrder(order.userId, order.id);
  return success(reply, result);
}

/**
 * 管理端交易统计
 */
export async function getStatistics(request: FastifyRequest, reply: FastifyReply) {
  const [totalOrders, openOrders, totalPnl] = await Promise.all([
    prisma.tradeOrder.count(),
    prisma.tradeOrder.count({ where: { status: 'open' } }),
    prisma.tradeOrder.aggregate({ where: { status: 'closed' }, _sum: { closedPnl: true } }),
  ]);

  return success(reply, {
    totalOrders,
    openOrders,
    totalPnl: totalPnl._sum.closedPnl?.toString() || '0',
  });
}
