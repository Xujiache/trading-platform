import { prisma } from '../../config/database';
import { TradeEngine } from '../../services/tradeEngine';
import { FeeCalculator } from '../../services/feeCalculator';
import { marketEngine } from '../../services/marketEngine';
import { NotFoundError, ValidationError } from '../../utils/errors';
import { generateOrderNo } from '../../utils/crypto';
import { parsePagination } from '../../utils/helpers';
import Decimal from 'decimal.js';
import type { CreateOrderInput, ModifyOrderInput, EstimateInput, PendingOrderInput } from './trade.schema';

/**
 * 下单
 */
export async function createOrder(userId: number, input: CreateOrderInput) {
  return TradeEngine.openOrder({
    userId,
    symbolId: input.symbolId,
    direction: input.direction,
    orderType: input.orderType,
    lots: input.lots,
    leverage: input.leverage,
    stopLoss: input.stopLoss,
    takeProfit: input.takeProfit,
    trailingStop: input.trailingStop,
  });
}

/**
 * 平仓
 */
export async function closeOrder(userId: number, orderId: number) {
  return TradeEngine.closeOrder(userId, orderId);
}

/**
 * 一键全部平仓
 */
export async function closeAll(userId: number) {
  return TradeEngine.closeAll(userId);
}

/**
 * 改单
 */
export async function modifyOrder(userId: number, orderId: number, input: ModifyOrderInput) {
  return TradeEngine.modifyOrder(userId, orderId, input);
}

/**
 * 持仓列表
 */
export async function getPositions(userId: number) {
  const positions = await prisma.tradeOrder.findMany({
    where: { userId, status: 'open' },
    include: { symbol: { select: { symbol: true, name: true, contractUnit: true, pricePrecision: true } } },
    orderBy: { openedAt: 'desc' },
  });

  const prices = await marketEngine.getCurrentPrice();
  const priceMap = new Map(prices.map((p) => [p.symbol, p]));

  return positions.map((p) => {
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
    return { ...p, floatingPnl, currentPrice: tick ? (p.direction === 'buy' ? tick.bid : tick.ask) : null };
  });
}

/**
 * 订单列表（支持状态筛选+分页）
 */
export async function getOrders(userId: number, query: { status?: string; page?: number; limit?: number }) {
  const { skip, take, page, limit } = parsePagination(query.page, query.limit);
  const where: Record<string, unknown> = { userId };
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

  return { list, total, page, limit };
}

/**
 * 订单详情
 */
export async function getOrderDetail(userId: number, orderId: number) {
  const order = await prisma.tradeOrder.findFirst({
    where: { id: orderId, userId },
    include: { symbol: true },
  });
  if (!order) throw new NotFoundError('订单不存在');
  return order;
}

/**
 * 账户信息
 */
export async function getAccountInfo(userId: number) {
  const account = await prisma.fundAccount.findUnique({ where: { userId } });
  if (!account) throw new NotFoundError('资金账户不存在');

  const balance = new Decimal(account.balance.toString());
  const usedMargin = new Decimal(account.usedMargin.toString());
  const floatingPnl = new Decimal(account.floatingPnl.toString());
  const equity = balance.plus(floatingPnl);
  const available = equity.minus(usedMargin);
  const marginRatio = usedMargin.isZero() ? new Decimal(0) : equity.div(usedMargin).mul(100);

  return {
    balance: balance.toFixed(2),
    equity: equity.toFixed(2),
    usedMargin: usedMargin.toFixed(2),
    availableMargin: available.toFixed(2),
    floatingPnl: floatingPnl.toFixed(2),
    marginRatio: marginRatio.toFixed(2),
  };
}

/**
 * 费用预估
 */
export async function estimateFees(input: EstimateInput) {
  const symbol = await prisma.tradingSymbol.findUnique({ where: { id: input.symbolId } });
  if (!symbol) throw new NotFoundError('品种不存在');

  const prices = await marketEngine.getCurrentPrice(symbol.symbol);
  if (!prices.length) throw new ValidationError('暂无行情数据');

  const price = input.direction === 'buy' ? parseFloat(prices[0].ask) : parseFloat(prices[0].bid);
  return FeeCalculator.estimate(symbol, input.lots, input.leverage, price);
}

/**
 * 创建挂单
 */
export async function createPendingOrder(userId: number, input: PendingOrderInput) {
  const symbol = await prisma.tradingSymbol.findUnique({ where: { id: input.symbolId } });
  if (!symbol) throw new NotFoundError('品种不存在');

  return prisma.pendingOrder.create({
    data: {
      orderNo: generateOrderNo('P'),
      userId,
      symbolId: input.symbolId,
      direction: input.direction,
      pendingType: input.pendingType,
      lots: input.lots,
      targetPrice: input.targetPrice,
      leverage: input.leverage,
      stopLoss: input.stopLoss,
      takeProfit: input.takeProfit,
      expireAt: input.expireAt ? new Date(input.expireAt) : null,
    },
  });
}

/**
 * 挂单列表
 */
export async function getPendingOrders(userId: number) {
  return prisma.pendingOrder.findMany({
    where: { userId, status: 'pending' },
    include: { symbol: { select: { symbol: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * 撤销挂单
 */
export async function cancelPendingOrder(userId: number, id: number) {
  const order = await prisma.pendingOrder.findFirst({ where: { id, userId, status: 'pending' } });
  if (!order) throw new NotFoundError('挂单不存在');
  await prisma.pendingOrder.update({ where: { id }, data: { status: 'cancelled' } });
  return { message: '挂单已撤销' };
}
