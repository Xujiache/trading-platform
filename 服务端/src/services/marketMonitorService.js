const marketData = require('./marketDataService');

const STALE_THRESHOLD_MS = 5 * 60 * 1000;
const CHECK_INTERVAL_MS = 60 * 1000;
const MAX_RESTART_ATTEMPTS = 3;
const COOLDOWN_MS = 60000;

let monitorTimer = null;
let restartAttempts = 0;
let lastRestartTime = 0;
let startedAt = null;
const recoveryHistory = [];

async function checkMarketHealth() {
  const lastUpdate = marketData.getLastUpdateTime();
  if (!lastUpdate) return;
  const staleMs = Date.now() - lastUpdate;
  if (staleMs > STALE_THRESHOLD_MS) {
    console.warn(`[Monitor] 行情数据已停滞 ${Math.floor(staleMs / 1000)}s，尝试恢复...`);
    await attemptRecovery();
  } else if (restartAttempts > 0 && staleMs < STALE_THRESHOLD_MS / 2) {
    restartAttempts = 0;
  }
}

async function attemptRecovery() {
  const now = Date.now();
  if (now - lastRestartTime < COOLDOWN_MS) return;
  if (restartAttempts >= MAX_RESTART_ATTEMPTS) {
    console.error('[Monitor] 连续恢复失败已达上限，需人工介入');
    recoveryHistory.push({ time: new Date().toISOString(), result: 'max_attempts_reached' });
    return;
  }
  restartAttempts++;
  lastRestartTime = now;
  const entry = { time: new Date().toISOString(), attempt: restartAttempts, result: 'pending' };
  try {
    marketData.stopPriceSimulation();
    await marketData.loadSymbols();
    marketData.startPriceSimulation(1000);
    restartAttempts = 0;
    entry.result = 'success';
    console.log('[Monitor] 行情服务恢复成功');
  } catch (err) {
    entry.result = 'failed';
    entry.error = err.message;
    console.error(`[Monitor] 恢复失败(${restartAttempts}/${MAX_RESTART_ATTEMPTS}): ${err.message}`);
  }
  recoveryHistory.push(entry);
  if (recoveryHistory.length > 50) recoveryHistory.shift();
}

function startMonitor() {
  if (monitorTimer) return;
  startedAt = new Date().toISOString();
  monitorTimer = setInterval(checkMarketHealth, CHECK_INTERVAL_MS);
  console.log('[Monitor] 行情源监控服务已启动');
}

function stopMonitor() {
  if (monitorTimer) { clearInterval(monitorTimer); monitorTimer = null; }
}

function getMonitorStatus() {
  const lastUpdate = marketData.getLastUpdateTime();
  return {
    isRunning: !!monitorTimer,
    startedAt,
    lastUpdateTime: lastUpdate ? new Date(lastUpdate).toISOString() : null,
    staleDurationMs: lastUpdate ? Date.now() - lastUpdate : null,
    staleThresholdMs: STALE_THRESHOLD_MS,
    restartAttempts,
    maxRestartAttempts: MAX_RESTART_ATTEMPTS,
    isHealthy: lastUpdate ? (Date.now() - lastUpdate) < STALE_THRESHOLD_MS : false,
    recentRecoveries: recoveryHistory.slice(-10),
  };
}

module.exports = { startMonitor, stopMonitor, getMonitorStatus };
