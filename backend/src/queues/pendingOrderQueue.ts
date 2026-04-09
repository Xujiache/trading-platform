import { Queue, Worker } from 'bullmq';
import { redis } from '../config/redis';
import { prisma } from '../config/database';
import { TradeEngine } from '../services/tradeEngine';
import { config } from '../config';
import Decimal from 'decimal.js';

const connection = { host: config.redis.host, port: config.redis.port, password: config.redis.password };

/**
 * 挂单监控队列 — 每秒检查所有 pending 挂单是否触发
 */
export const pendingOrderQueue = new Queue('pendingOrder', { connection });

/**
 * 启动挂单监控 Worker
 * 检查限价单/止损单是否达到目标价格并触发执行
 */
export function startPendingOrderWorker() {
  const worker = new Worker('pendingOrder', async () => {
    const pendingOrders = await prisma.pendingOrder.findMany({
      where: { status: 'pending' },
      include: { symbol: true },
    });

    for (const order of pendingOrders) {
      try {
        if (order.expireAt && new Date() > order.expireAt) {
          await prisma.pendingOrder.update({
            where: { id: order.id },
            data: { status: 'expired' },
          });
          continue;
        }

        const priceData = await redis.hget('market:prices', order.symbol.symbol);
        if (!priceData) continue;

        const tick = JSON.parse(priceData);
        const currentBid = new Decimal(tick.bid);
        const currentAsk = new Decimal(tick.ask);
        const target = new Decimal(order.targetPrice.toString());

        let shouldTrigger = false;

        switch (order.pendingType) {
          case 'buy_limit':
            shouldTrigger = currentAsk.lte(target);
            break;
          case 'sell_limit':
            shouldTrigger = currentBid.gte(target);
            break;
          case 'buy_stop':
            shouldTrigger = currentAsk.gte(target);
            break;
          case 'sell_stop':
            shouldTrigger = currentBid.lte(target);
            break;
        }

        if (shouldTrigger) {
          const tradeOrder = await TradeEngine.openOrder({
            userId: order.userId,
            symbolId: order.symbolId,
            direction: order.direction as 'buy' | 'sell',
            orderType: 'market',
            lots: Number(order.lots),
            leverage: order.leverage,
            stopLoss: order.stopLoss ? Number(order.stopLoss) : undefined,
            takeProfit: order.takeProfit ? Number(order.takeProfit) : undefined,
            trailingStop: order.trailingStop ? Number(order.trailingStop) : undefined,
          });

          await prisma.pendingOrder.update({
            where: { id: order.id },
            data: {
              status: 'triggered',
              triggeredAt: new Date(),
              tradeOrderId: tradeOrder.id,
            },
          });
        }
      } catch (err) {
        console.error(`[PendingOrderQueue] Order ${order.id} check failed:`, err);
      }
    }
  }, { connection });

  worker.on('error', (err) => console.error('[PendingOrderQueue] Worker error:', err));
}
