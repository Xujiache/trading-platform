import { Queue, Worker } from 'bullmq';
import { klineAggregator } from '../services/klineAggregator';
import { config } from '../config';

const connection = { host: config.redis.host, port: config.redis.port, password: config.redis.password };

/**
 * K 线聚合队列 — 每分钟执行一次
 * 将实时 tick 数据聚合为多周期 K 线并持久化到数据库
 */
export const klineQueue = new Queue('kline', { connection });

/**
 * 启动 K 线聚合 Worker
 */
export function startKlineWorker() {
  const worker = new Worker('kline', async () => {
    try {
      await klineAggregator.flushBars();
    } catch (err) {
      console.error('[KlineQueue] Aggregation failed:', err);
    }
  }, { connection });

  worker.on('error', (err) => console.error('[KlineQueue] Worker error:', err));
}
