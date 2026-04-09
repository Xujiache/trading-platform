import { Queue, Worker } from 'bullmq';
import { redis } from '../config/redis';
import { prisma } from '../config/database';
import { config } from '../config';
import Decimal from 'decimal.js';

const connection = { host: config.redis.host, port: config.redis.port, password: config.redis.password };

/**
 * 行情监控队列 — 每分钟检查价格预警是否触发
 * 检查用户设置的价格预警条件并发送通知
 */
export const marketMonitorQueue = new Queue('marketMonitor', { connection });

/**
 * 启动行情监控 Worker
 */
export function startMarketMonitorWorker() {
  const worker = new Worker('marketMonitor', async () => {
    const activeAlerts = await prisma.priceAlert.findMany({
      where: { status: 'active' },
      include: { symbol: true },
    });

    for (const alert of activeAlerts) {
      try {
        const priceData = await redis.hget('market:prices', alert.symbol.symbol);
        if (!priceData) continue;

        const tick = JSON.parse(priceData);
        const currentPrice = new Decimal(tick.last);
        const targetValue = new Decimal(alert.targetValue.toString());

        let triggered = false;

        switch (alert.alertType) {
          case 'price_above':
            triggered = currentPrice.gte(targetValue);
            break;
          case 'price_below':
            triggered = currentPrice.lte(targetValue);
            break;
          case 'change_percent': {
            const changePercent = new Decimal(tick.changePercent).abs();
            triggered = changePercent.gte(targetValue);
            break;
          }
        }

        if (triggered) {
          await prisma.priceAlert.update({
            where: { id: alert.id },
            data: { status: 'triggered', triggeredAt: new Date() },
          });

          await prisma.notification.create({
            data: {
              userId: alert.userId,
              type: 'alert',
              title: '价格预警触发',
              content: `${alert.symbol.name}(${alert.symbol.symbol}) 已达到您设置的预警条件: ${alert.alertType === 'price_above' ? '价格上穿' : alert.alertType === 'price_below' ? '价格下穿' : '波幅达到'} ${targetValue.toFixed(2)}，当前价格 ${currentPrice.toFixed(2)}`,
            },
          });
        }
      } catch (err) {
        console.error(`[MarketMonitorQueue] Alert ${alert.id} check failed:`, err);
      }
    }
  }, { connection });

  worker.on('error', (err) => console.error('[MarketMonitorQueue] Worker error:', err));
}
