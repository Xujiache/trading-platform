import { Queue, Worker } from 'bullmq';
import { redis } from '../config/redis';
import { prisma } from '../config/database';
import { config } from '../config';
import Decimal from 'decimal.js';

const connection = { host: config.redis.host, port: config.redis.port, password: config.redis.password };

/**
 * 移动止损队列 — 每秒检查持仓订单的移动止损
 * 当价格向有利方向移动时自动调整止损价位
 */
export const trailingStopQueue = new Queue('trailingStop', { connection });

/**
 * 启动移动止损 Worker
 */
export function startTrailingStopWorker() {
  const worker = new Worker('trailingStop', async () => {
    const orders = await prisma.tradeOrder.findMany({
      where: {
        status: 'open',
        trailingStop: { not: null },
      },
      include: { symbol: true },
    });

    for (const order of orders) {
      try {
        const priceData = await redis.hget('market:prices', order.symbol.symbol);
        if (!priceData) continue;

        const tick = JSON.parse(priceData);
        const currentBid = new Decimal(tick.bid);
        const currentAsk = new Decimal(tick.ask);
        const trailingPoints = new Decimal(order.trailingStop!.toString());
        const openPrice = new Decimal(order.openPrice!.toString());
        const currentStopLoss = order.stopLoss ? new Decimal(order.stopLoss.toString()) : null;

        let newStopLoss: Decimal | null = null;

        if (order.direction === 'buy') {
          const idealStop = currentBid.minus(trailingPoints);
          if (!currentStopLoss || idealStop.gt(currentStopLoss)) {
            if (idealStop.gt(openPrice)) {
              newStopLoss = idealStop;
            }
          }
        } else {
          const idealStop = currentAsk.plus(trailingPoints);
          if (!currentStopLoss || idealStop.lt(currentStopLoss)) {
            if (idealStop.lt(openPrice)) {
              newStopLoss = idealStop;
            }
          }
        }

        if (newStopLoss) {
          await prisma.tradeOrder.update({
            where: { id: order.id },
            data: { stopLoss: newStopLoss.toNumber() },
          });
        }
      } catch (err) {
        console.error(`[TrailingStopQueue] Order ${order.id} check failed:`, err);
      }
    }
  }, { connection });

  worker.on('error', (err) => console.error('[TrailingStopQueue] Worker error:', err));
}
