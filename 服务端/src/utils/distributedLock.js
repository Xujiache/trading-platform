const { redis } = require('../config/redis');
const { v4: uuidv4 } = require('uuid');

const DEFAULT_TTL = 10000;
const RETRY_DELAY = 50;
const MAX_RETRIES = 100;

async function acquireLock(key, ttl = DEFAULT_TTL) {
  const lockKey = `lock:${key}`;
  const lockValue = uuidv4();

  for (let i = 0; i < MAX_RETRIES; i++) {
    const result = await redis.set(lockKey, lockValue, 'PX', ttl, 'NX');
    if (result === 'OK') {
      return { lockKey, lockValue };
    }
    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
  }

  return null;
}

const RELEASE_SCRIPT = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
else
  return 0
end
`;

async function releaseLock(lockHandle) {
  if (!lockHandle) return false;
  const { lockKey, lockValue } = lockHandle;
  const result = await redis.eval(RELEASE_SCRIPT, 1, lockKey, lockValue);
  return result === 1;
}

async function withLock(key, fn, ttl = DEFAULT_TTL) {
  const lock = await acquireLock(key, ttl);
  if (!lock) {
    throw new Error('获取锁失败，系统繁忙请稍后重试');
  }
  try {
    return await fn();
  } finally {
    await releaseLock(lock);
  }
}

module.exports = { acquireLock, releaseLock, withLock };
