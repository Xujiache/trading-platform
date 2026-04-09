import { Queue, Worker } from 'bullmq';
import { redis } from '../config/redis';
import { prisma } from '../config/database';
import { config } from '../config';
import Decimal from 'decimal.js';

const connection = { host: config.redis.host, port: config.redis.port, password: config.redis.password };

/**
 * 浮动盈亏更新队列 — 每秒更新所有持仓订单的浮动盈亏
 * 并同步更新用户资金账户的浮动盈亏总和
 */
export const floatingPnlQueue = new Queue('floatingPnl', { connection });

/**
 * 启动浮动盈亏更新 Worker
 * 做多: 浮盈 = (当前价 - 开仓价) × 合约单位 × 手数
 * 做空: 浮盈 = (开仓价 - 当前价) × 合约单位 × 手数
 */
export function startFloatingPnlWorker() {
  const worker = new Worker('floatingPnl', async () => {
    const openOrders = await prisma.tradeOrder.findMany({
      where: { status: 'open' },
      include: { symbol: true },
    });

    const userPnlMap = new Map<number, Decimal>();

    for (const order of openOrders) {
      try {
        const priceData = await redis.hget('market:prices', order.symbol.symbol);
        if (!priceData || !order.openPrice) continue;

        const tick = JSON.parse(priceData);
        const currentPrice = order.direction === 'buy'
          ? new Decimal(tick.bid)
          : new Decimal(tick.ask);

        const openPrice = new Decimal(order.openPrice.toString());
        const lots = new Decimal(order.lots.toString());
        const contractUnit = order.symbol.contractUnit;

        let pnl: Decimal;
        if (order.direction === 'buy') {
          pnl = currentPrice.minus(openPrice).mul(contractUnit).mul(lots);
        } else {
          pnl = openPrice.minus(currentPrice).mul(contractUnit).mul(lots);
        }

        const roundedPnl = pnl.toDecimalPlaces(2);

        await prisma.tradeOrder.update({
          where: { id: order.id },
          data: { floatingPnl: roundedPnl.toNumber() },
        });

        const existing = userPnlMap.get(order.userId) || new Decimal(0);
        userPnlMap.set(order.userId, existing.plus(roundedPnl));
      } catch (err) {
        console.error(`[FloatingPnlQueue] Order ${order.id} update failed:`, err);
      }
    }

    for (const [userId, totalPnl] of userPnlMap.entries()) {
      try {
        await prisma.fundAccount.update({
          where: { userId },
          data: { floatingPnl: totalPnl.toNumber() },
        });
      } catch (err) {
        console.error(`[FloatingPnlQueue] User ${userId} pnl update failed:`, err);
      }
    }
  }, { connection });

  worker.on('error', (err) => console.error('[FloatingPnlQueue] Worker error:', err));
}
