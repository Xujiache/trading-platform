import Redis from 'ioredis';
import { config } from './index';

/**
 * Redis 连接实例，用于缓存/会话/行情数据/任务队列
 */
export const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  maxRetriesPerRequest: null,
  retryStrategy(times: number) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on('connect', () => {
  console.log('[Redis] Connected successfully');
});

redis.on('error', (err: Error) => {
  console.error('[Redis] Connection error:', err.message);
});
