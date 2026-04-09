import Decimal from 'decimal.js';
import { prisma } from '../config/database';
import { marketEngine } from './marketEngine';
import { FeeCalculator } from './feeCalculator';
import { TradeValidator } from './tradeValidator';
import { NotFoundError, ValidationError } from '../utils/errors';
import { generateOrderNo } from '../utils/crypto';

interface OpenOrderParams {
  userId: number;
  symbolId: number;
  direction: 'buy' | 'sell';
  orderType: 'market' | 'limit' | 'stop';
  lots: number;
  leverage: number;
  stopLoss?: number;
  takeProfit?: number;
  trailingStop?: number;
}

/**
 * 交易引擎
 * 处理市价单/限价单执行、平仓、全平等核心交易逻辑
 */
export class TradeEngine {
  /**
   * 开仓（市价单）
   * @param params - 下单参数
   * @returns 交易订单
   */
  static async openOrder(params: OpenOrderParams) {
    const { userId, symbolId, direction, lots, leverage, stopLoss, takeProfit, trailingStop } = params;

    const symbol = await prisma.tradingSymbol.findUnique({ where: { id: symbolId } });
    if (!symbol) throw new NotFoundError('品种不存在');

    const account = await prisma.fundAccount.findUnique({ where: { userId } });
    if (!account) throw new NotFoundError('资金账户不存在');

    const prices = await marketEngine.getCurrentPrice(symbol.symbol);
    if (!prices.length) throw new ValidationError('暂无行情数据');

    const tick = prices[0];
    const openPrice = direction === 'buy' ? new Decimal(tick.ask) : new Decimal(tick.bid);

    const currentPositionLots = await this.getUserPositionLots(userId, symbolId);
    TradeValidator.validate(symbol, account, lots, leverage, openPrice.toNumber(), currentPositionLots);

    const lotsD = new Decimal(lots);
    const margin = FeeCalculator.calcMargin(symbol.contractUnit, lotsD, openPrice, leverage);
    const spreadCost = FeeCalculator.calcSpreadCost(symbol, lotsD);
    const commission = FeeCalculator.calcCommission(symbol, lotsD, openPrice);

    const order = await prisma.$transaction(async (tx) => {
      const tradeOrder = await tx.tradeOrder.create({
        data: {
          orderNo: generateOrderNo('T'),
          userId,
          symbolId,
          direction,
          orderType: params.orderType,
          lots,
          leverage,
          openPrice: openPrice.toFixed(4),
          stopLoss: stopLoss ?? null,
          takeProfit: takeProfit ?? null,
          trailingStop: trailingStop ?? null,
          margin: margin.toFixed(2),
          spreadCost: spreadCost.toFixed(2),
          commission: commission.toFixed(2),
          status: 'open',
        },
      });

      await tx.fundAccount.update({
        where: { userId },
        data: {
          balance: { decrement: commission.plus(spreadCost).toNumber() },
          usedMargin: { increment: margin.toNumber() },
          totalCommission: { increment: commission.toNumber() },
        },
      });

      await tx.fundFlow.create({
        data: {
          userId,
          flowType: 'commission',
          amount: commission.negated().toNumber(),
          balanceBefore: account.balance.toNumber(),
          balanceAfter: new Decimal(account.balance.toString()).minus(commission).minus(spreadCost).toNumber(),
          refType: 'trade_order',
          refId: tradeOrder.id,
          remark: `开仓手续费 ${symbol.symbol} ${lots}手`,
        },
      });

      return tradeOrder;
    });

    return order;
  }

  /**
   * 平仓
   * @param userId - 用户 ID
   * @param orderId - 交易订单 ID
   * @returns 平仓后的订单
   */
  static async closeOrder(userId: number, orderId: number) {
    const order = await prisma.tradeOrder.findFirst({
      where: { id: orderId, userId, status: 'open' },
      include: { symbol: true },
    });

    if (!order) throw new NotFoundError('订单不存在或已平仓');

    const prices = await marketEngine.getCurrentPrice(order.symbol.symbol);
    if (!prices.length) throw new ValidationError('暂无行情数据');

    const tick = prices[0];
    const closePrice = order.direction === 'buy' ? new Decimal(tick.bid) : new Decimal(tick.ask);
    const openPrice = new Decimal(order.openPrice!.toString());
    const lotsD = new Decimal(order.lots.toString());

    const pnl = FeeCalculator.calcFloatingPnl(order.direction, openPrice, closePrice, order.symbol.contractUnit, lotsD);
    const margin = new Decimal(order.margin.toString());

    let closeCommission = new Decimal(0);
    if (order.symbol.commissionSide === 'double') {
      closeCommission = FeeCalculator.calcCommission(order.symbol, lotsD, closePrice);
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.tradeOrder.update({
        where: { id: orderId },
        data: {
          closePrice: closePrice.toFixed(4),
          closedPnl: pnl.toFixed(2),
          status: 'closed',
          closedAt: new Date(),
          closeReason: 'manual',
          commission: new Decimal(order.commission.toString()).plus(closeCommission).toFixed(2),
        },
      });

      const account = await tx.fundAccount.findUnique({ where: { userId } });
      const balanceBefore = new Decimal(account!.balance.toString());
      const returnAmount = margin.plus(pnl).minus(closeCommission);

      await tx.fundAccount.update({
        where: { userId },
        data: {
          balance: { increment: returnAmount.toNumber() },
          usedMargin: { decrement: margin.toNumber() },
          totalPnl: { increment: pnl.toNumber() },
          totalCommission: { increment: closeCommission.toNumber() },
        },
      });

      await tx.fundFlow.create({
        data: {
          userId,
          flowType: 'pnl',
          amount: pnl.toNumber(),
          balanceBefore: balanceBefore.toNumber(),
          balanceAfter: balanceBefore.plus(returnAmount).toNumber(),
          refType: 'trade_order',
          refId: orderId,
          remark: `平仓盈亏 ${order.symbol.symbol} ${pnl.gte(0) ? '+' : ''}${pnl.toFixed(2)}`,
        },
      });

      return updated;
    });

    return result;
  }

  /**
   * 一键全部平仓
   * @param userId - 用户 ID
   * @returns 平仓结果
   */
  static async closeAll(userId: number) {
    const openOrders = await prisma.tradeOrder.findMany({
      where: { userId, status: 'open' },
    });

    const results = [];
    for (const order of openOrders) {
      try {
        const result = await this.closeOrder(userId, order.id);
        results.push({ orderId: order.id, status: 'closed', pnl: result.closedPnl });
      } catch (err) {
        results.push({ orderId: order.id, status: 'failed', error: (err as Error).message });
      }
    }

    return { closedCount: results.filter((r) => r.status === 'closed').length, results };
  }

  /**
   * 修改订单（止损/止盈/移动止损）
   * @param userId - 用户 ID
   * @param orderId - 订单 ID
   * @param updates - 修改内容
   */
  static async modifyOrder(userId: number, orderId: number, updates: { stopLoss?: number; takeProfit?: number; trailingStop?: number }) {
    const order = await prisma.tradeOrder.findFirst({
      where: { id: orderId, userId, status: 'open' },
    });
    if (!order) throw new NotFoundError('订单不存在或已平仓');

    return prisma.tradeOrder.update({
      where: { id: orderId },
      data: updates,
    });
  }

  /**
   * 获取用户在某品种上的持仓总手数
   */
  private static async getUserPositionLots(userId: number, symbolId: number): Promise<number> {
    const result = await prisma.tradeOrder.aggregate({
      where: { userId, symbolId, status: 'open' },
      _sum: { lots: true },
    });
    return result._sum.lots ? new Decimal(result._sum.lots.toString()).toNumber() : 0;
  }
}
