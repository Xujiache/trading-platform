import { redis } from '../config/redis';

/**
 * 启动所有 BullMQ 任务队列及对应 Worker
 * 先检查 Redis 版本，低于 5.0 时跳过队列功能
 */
export async function startAllQueues() {
  try {
    const info = await redis.info('server');
    const versionMatch = info.match(/redis_version:(\d+\.\d+)/);
    const majorVersion = versionMatch ? parseFloat(versionMatch[1]) : 0;

    if (majorVersion < 5) {
      console.warn(`[Queues] Redis 版本 ${versionMatch?.[1] || '未知'} 低于 BullMQ 要求的 5.0，队列功能已禁用。生产环境请升级 Redis >= 5.0。`);
      return;
    }

    const { startPendingOrderWorker, pendingOrderQueue } = await import('./pendingOrderQueue');
    const { startOvernightFeeWorker, overnightFeeQueue } = await import('./overnightFeeQueue');
    const { startTrailingStopWorker, trailingStopQueue } = await import('./trailingStopQueue');
    const { startFloatingPnlWorker, floatingPnlQueue } = await import('./floatingPnlQueue');
    const { startKlineWorker, klineQueue } = await import('./klineQueue');
    const { startMarketMonitorWorker, marketMonitorQueue } = await import('./marketMonitorQueue');

    startPendingOrderWorker();
    startTrailingStopWorker();
    startFloatingPnlWorker();
    startKlineWorker();
    startMarketMonitorWorker();
    startOvernightFeeWorker();

    await pendingOrderQueue.upsertJobScheduler('pending-order-check', { every: 1000 }, { name: 'check' });
    await trailingStopQueue.upsertJobScheduler('trailing-stop-check', { every: 1000 }, { name: 'check' });
    await floatingPnlQueue.upsertJobScheduler('floating-pnl-update', { every: 1000 }, { name: 'update' });
    await klineQueue.upsertJobScheduler('kline-aggregate', { every: 60000 }, { name: 'aggregate' });
    await marketMonitorQueue.upsertJobScheduler('market-monitor', { every: 60000 }, { name: 'monitor' });
    await overnightFeeQueue.upsertJobScheduler('overnight-fee-settle', {
      pattern: '0 5 * * *',
      tz: 'Asia/Shanghai',
    }, { name: 'settle' });

    console.log('[Queues] All queues started');
  } catch (err: any) {
    console.error('[Queues] Failed to start:', err?.message);
  }
}
