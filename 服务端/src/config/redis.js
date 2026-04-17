const Redis = require('ioredis');
const config = require('./index');

const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password || undefined,
  db: config.redis.db,
  retryStrategy(times) {
    const delay = Math.min(times * 500, 5000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

redis.on('connect', () => {
  console.log('[Redis] 连接成功');
});

redis.on('error', (err) => {
  console.error('[Redis] 连接错误:', err.message);
});

async function testConnection() {
  try {
    await redis.connect();
    await redis.ping();
    console.log('[Redis] PING 成功');
    return true;
  } catch (error) {
    if (error.message && error.message.includes('already')) {
      return true;
    }
    console.error('[Redis] 连接测试失败:', error.message);
    return false;
  }
}

module.exports = { redis, testConnection };
