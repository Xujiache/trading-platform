/**
 * 自定义价格模拟引擎
 *
 * 面向"自控品种"(price_source='custom') 和"混合品种"(price_source='hybrid')。
 * 基于 Ornstein-Uhlenbeck 过程 + 趋势漂移 + 软边界反弹, 产生真实感的行情走势。
 *
 *   dp = trend_drift + kappa * (center - p) + sigma * randn() * sqrt(dt)
 *
 * 每品种独立定时器; 配置修改后通过 reloadConfig 热加载; 支持手动推价 / 重置中枢。
 *
 * 内置幂等 ensureSchema(), 启动时自动建表/补列, 无需单独运行迁移脚本。
 */

const { query } = require('../config/database');
const marketData = require('./marketDataService');

const VOLATILITY_PRESETS = {
  low: 0.0003,
  medium: 0.0008,
  high: 0.0015,
};

const KAPPA_PRESETS = {
  sideways: 0.06,
  up: 0.01,
  down: 0.01,
};

const TREND_SIGN = { up: 1, down: -1, sideways: 0 };

const MIN_TICK_INTERVAL_MS = 200;
const MAX_TICK_INTERVAL_MS = 30000;
const PERSIST_INTERVAL_MS = 30000;
const DEFAULT_SPREAD_TICK = 3;

const runtimeStates = new Map();
let persistTimer = null;
let running = false;

function randn() {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function clamp(v, lo, hi) {
  if (v < lo) return lo;
  if (v > hi) return hi;
  return v;
}

/**
 * 幂等迁移: 给 trading_symbols 补 price_source 列, 并建 symbol_sim_configs 表。
 */
async function ensureSchema() {
  try {
    const cols = await query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trading_symbols' AND COLUMN_NAME = 'price_source'`
    );
    if (cols.length === 0) {
      await query(
        `ALTER TABLE trading_symbols
         ADD COLUMN price_source ENUM('real','custom','hybrid') NOT NULL DEFAULT 'real'
         COMMENT '行情源: real外部API / custom自控模拟 / hybrid混合' AFTER status`
      );
      console.log('[CustomPrice] ALTER trading_symbols ADD price_source 完成');
    }
  } catch (err) {
    console.error('[CustomPrice] ALTER trading_symbols 失败:', err.message);
  }

  try {
    await query(
      `CREATE TABLE IF NOT EXISTS symbol_sim_configs (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        symbol_id INT UNSIGNED NOT NULL UNIQUE COMMENT '品种ID',
        symbol VARCHAR(20) NOT NULL UNIQUE COMMENT '品种代码',
        center_price DECIMAL(20,8) NOT NULL COMMENT '中枢价格',
        lower_bound DECIMAL(20,8) NOT NULL COMMENT '区间下限',
        upper_bound DECIMAL(20,8) NOT NULL COMMENT '区间上限',
        trend_direction ENUM('up','down','sideways') DEFAULT 'sideways' COMMENT '趋势方向',
        trend_strength DECIMAL(10,4) DEFAULT 0.5000 COMMENT '趋势强度 0~1',
        volatility_level ENUM('low','medium','high','custom') DEFAULT 'medium' COMMENT '波动档位',
        volatility_sigma DECIMAL(12,8) DEFAULT NULL COMMENT '自定义sigma, 覆盖level',
        mean_reversion_kappa DECIMAL(10,6) DEFAULT NULL COMMENT '自定义均值回归强度',
        tick_interval_ms INT DEFAULT 1000 COMMENT 'tick间隔 200~30000ms',
        max_tick_change_pct DECIMAL(6,4) DEFAULT 0.0015 COMMENT '单tick最大百分比',
        hybrid_bias DECIMAL(10,4) DEFAULT 0.0000 COMMENT 'hybrid模式下叠加偏置',
        last_price DECIMAL(20,8) DEFAULT NULL COMMENT '最近tick价,用于热重启',
        enabled TINYINT(1) DEFAULT 1 COMMENT '是否启用',
        updated_by INT UNSIGNED DEFAULT NULL COMMENT '最后更新管理员ID',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_enabled (enabled),
        INDEX idx_symbol (symbol)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='自控品种模拟配置表'`
    );
  } catch (err) {
    console.error('[CustomPrice] CREATE symbol_sim_configs 失败:', err.message);
  }
}

function sanitizeConfig(raw) {
  const cfg = {
    symbolId: Number(raw.symbol_id),
    symbol: raw.symbol,
    centerPrice: parseFloat(raw.center_price),
    lowerBound: parseFloat(raw.lower_bound),
    upperBound: parseFloat(raw.upper_bound),
    trendDirection: raw.trend_direction || 'sideways',
    trendStrength: raw.trend_strength != null ? parseFloat(raw.trend_strength) : 0.5,
    volatilityLevel: raw.volatility_level || 'medium',
    volatilitySigma: raw.volatility_sigma != null ? parseFloat(raw.volatility_sigma) : null,
    meanReversionKappa: raw.mean_reversion_kappa != null ? parseFloat(raw.mean_reversion_kappa) : null,
    tickIntervalMs: Number(raw.tick_interval_ms) || 1000,
    maxTickChangePct: raw.max_tick_change_pct != null ? parseFloat(raw.max_tick_change_pct) : 0.0015,
    hybridBias: raw.hybrid_bias != null ? parseFloat(raw.hybrid_bias) : 0,
    lastPrice: raw.last_price != null ? parseFloat(raw.last_price) : null,
    enabled: raw.enabled === undefined ? 1 : Number(raw.enabled),
  };
  cfg.tickIntervalMs = clamp(cfg.tickIntervalMs, MIN_TICK_INTERVAL_MS, MAX_TICK_INTERVAL_MS);
  cfg.trendStrength = clamp(cfg.trendStrength, 0, 1);
  cfg.maxTickChangePct = clamp(cfg.maxTickChangePct, 0.0001, 0.05);
  if (cfg.upperBound <= cfg.lowerBound) {
    throw new Error('配置非法: upper_bound 必须大于 lower_bound');
  }
  if (cfg.centerPrice < cfg.lowerBound || cfg.centerPrice > cfg.upperBound) {
    throw new Error('配置非法: center_price 必须在 [lower_bound, upper_bound] 区间内');
  }
  return cfg;
}

function resolveSigma(cfg) {
  if (cfg.volatilityLevel === 'custom' && cfg.volatilitySigma != null) return cfg.volatilitySigma;
  return VOLATILITY_PRESETS[cfg.volatilityLevel] || VOLATILITY_PRESETS.medium;
}

function resolveKappa(cfg) {
  if (cfg.meanReversionKappa != null) return cfg.meanReversionKappa;
  return KAPPA_PRESETS[cfg.trendDirection] || KAPPA_PRESETS.sideways;
}

function resolveSpread(symbolInfo) {
  const spread = parseFloat(symbolInfo.spread_fixed) || 0;
  const tickSize = parseFloat(symbolInfo.tick_size) || 0.01;
  if (spread > 0) return spread * tickSize;
  return DEFAULT_SPREAD_TICK * tickSize;
}

function roundToTick(value, tickSize, decimals) {
  if (!tickSize || tickSize <= 0) return parseFloat(value.toFixed(decimals));
  return parseFloat((Math.round(value / tickSize) * tickSize).toFixed(decimals));
}

function doTick(state) {
  const cfg = state.config;
  const symbolInfo = marketData.getSymbolInfo(cfg.symbol);
  if (!symbolInfo) return;

  const priceSource = symbolInfo.price_source || 'real';
  if (priceSource === 'real') return;

  const decimals = symbolInfo.price_decimals != null ? Number(symbolInfo.price_decimals) : 2;
  const tickSize = parseFloat(symbolInfo.tick_size) || 0.01;
  const current = marketData.getPrice(cfg.symbol);
  const previous = current && current.bid ? parseFloat(current.bid) : (cfg.lastPrice || cfg.centerPrice);

  const range = cfg.upperBound - cfg.lowerBound;
  const edgeDist = Math.min(previous - cfg.lowerBound, cfg.upperBound - previous) / range;

  const sign = TREND_SIGN[cfg.trendDirection] || 0;
  const trendDrift = sign * cfg.trendStrength * cfg.centerPrice * 0.0001;
  let kappa = resolveKappa(cfg);
  if (edgeDist < 0.1) kappa *= 3;
  else if (edgeDist < 0.2) kappa *= 1.6;

  const sigma = resolveSigma(cfg);
  const dtUnit = Math.sqrt(Math.max(cfg.tickIntervalMs, MIN_TICK_INTERVAL_MS) / 1000);
  const noise = sigma * randn() * previous * dtUnit;
  const reversion = kappa * (cfg.centerPrice - previous);

  let dp = trendDrift + reversion + noise;
  if (priceSource === 'hybrid' && cfg.hybridBias) {
    dp += cfg.hybridBias;
  }

  const maxChange = Math.abs(cfg.centerPrice) * cfg.maxTickChangePct;
  if (dp > maxChange) dp = maxChange;
  if (dp < -maxChange) dp = -maxChange;

  let newBid = previous + dp;
  const hardPad = range * 0.01;
  newBid = clamp(newBid, cfg.lowerBound - hardPad, cfg.upperBound + hardPad);
  newBid = roundToTick(newBid, tickSize, decimals);

  const spreadValue = resolveSpread(symbolInfo);
  const newAsk = parseFloat((newBid + spreadValue).toFixed(decimals));
  const prevOpen = current && current.open ? parseFloat(current.open) : newBid;
  const prevClose = current && current.prev_close ? parseFloat(current.prev_close) : newBid;
  const high = current && current.high ? Math.max(parseFloat(current.high), newBid) : newBid;
  const low = current && current.low ? Math.min(parseFloat(current.low), newBid) : newBid;
  const change = parseFloat((newBid - prevOpen).toFixed(decimals));
  const changePercent = prevOpen !== 0 ? parseFloat(((change / prevOpen) * 100).toFixed(4)) : 0;
  const volume = (current && current.volume ? Number(current.volume) : 0) + Math.floor(Math.random() * 30);

  marketData.priceCache.set(cfg.symbol, {
    symbol: cfg.symbol,
    name: symbolInfo.name,
    category: symbolInfo.category,
    bid: newBid,
    ask: newAsk,
    high,
    low,
    open: prevOpen,
    prev_close: prevClose,
    change,
    change_percent: changePercent,
    volume,
    timestamp: Date.now(),
  });

  state.tickCount += 1;
  state.lastPrice = newBid;
  state.lastTickAt = Date.now();
}

function startTimerForSymbol(state) {
  if (state.timer) clearInterval(state.timer);
  const interval = state.config.tickIntervalMs;
  state.timer = setInterval(() => {
    try {
      doTick(state);
    } catch (err) {
      state.errorCount = (state.errorCount || 0) + 1;
      if (state.errorCount % 20 === 1) {
        console.error(`[CustomPrice] tick error ${state.config.symbol}: ${err.message}`);
      }
    }
  }, interval);
}

function stopTimerForSymbol(symbol) {
  const state = runtimeStates.get(symbol);
  if (state && state.timer) {
    clearInterval(state.timer);
    state.timer = null;
  }
}

async function loadActiveConfigs() {
  return query(
    `SELECT s.price_source, c.*
     FROM trading_symbols s
     INNER JOIN symbol_sim_configs c ON c.symbol_id = s.id
     WHERE s.price_source IN ('custom','hybrid')
       AND s.status = 'active'
       AND c.enabled = 1`
  );
}

async function start() {
  if (running) return;
  await ensureSchema();
  running = true;
  let rows = [];
  try {
    rows = await loadActiveConfigs();
  } catch (err) {
    console.error('[CustomPrice] 加载配置失败:', err.message);
    rows = [];
  }
  for (const row of rows) {
    try {
      const cfg = sanitizeConfig(row);
      const state = {
        config: cfg,
        lastPrice: cfg.lastPrice || cfg.centerPrice,
        tickCount: 0,
        errorCount: 0,
        timer: null,
        startedAt: Date.now(),
      };
      if (!marketData.getPrice(cfg.symbol)) {
        const info = marketData.getSymbolInfo(cfg.symbol);
        if (info) {
          marketData.priceCache.set(cfg.symbol, {
            symbol: cfg.symbol,
            name: info.name,
            category: info.category,
            bid: state.lastPrice,
            ask: state.lastPrice,
            high: state.lastPrice,
            low: state.lastPrice,
            open: state.lastPrice,
            prev_close: state.lastPrice,
            change: 0,
            change_percent: 0,
            volume: 0,
            timestamp: Date.now(),
          });
        }
      }
      runtimeStates.set(cfg.symbol, state);
      startTimerForSymbol(state);
    } catch (err) {
      console.error(`[CustomPrice] init ${row.symbol} failed: ${err.message}`);
    }
  }
  if (!persistTimer) {
    persistTimer = setInterval(persistAll, PERSIST_INTERVAL_MS);
  }
  console.log(`[CustomPrice] Engine started, active symbols: ${runtimeStates.size}`);
}

function stop() {
  running = false;
  for (const [, state] of runtimeStates) {
    if (state.timer) clearInterval(state.timer);
    state.timer = null;
  }
  if (persistTimer) { clearInterval(persistTimer); persistTimer = null; }
  runtimeStates.clear();
  console.log('[CustomPrice] Engine stopped');
}

async function persistAll() {
  const entries = Array.from(runtimeStates.values());
  for (const state of entries) {
    if (state.lastPrice == null) continue;
    try {
      await query(
        'UPDATE symbol_sim_configs SET last_price = ? WHERE symbol_id = ?',
        [state.lastPrice, state.config.symbolId]
      );
    } catch (_) { /* ignore */ }
  }
}

async function reloadConfig(symbolId) {
  const rows = await query(
    `SELECT s.price_source, s.status, c.*
     FROM trading_symbols s
     LEFT JOIN symbol_sim_configs c ON c.symbol_id = s.id
     WHERE s.id = ? LIMIT 1`,
    [symbolId]
  );
  if (rows.length === 0) {
    throw new Error('品种不存在');
  }
  const row = rows[0];
  const priceSource = row.price_source || 'real';

  if (!row.symbol_id || priceSource === 'real' || row.status !== 'active' || Number(row.enabled) === 0) {
    const oldState = Array.from(runtimeStates.values()).find((s) => s.config.symbolId === symbolId);
    if (oldState) {
      stopTimerForSymbol(oldState.config.symbol);
      runtimeStates.delete(oldState.config.symbol);
    }
    return { active: false, symbol: row.symbol || null };
  }

  const cfg = sanitizeConfig(row);
  stopTimerForSymbol(cfg.symbol);
  const existing = runtimeStates.get(cfg.symbol);
  const state = {
    config: cfg,
    lastPrice: existing && existing.lastPrice != null ? existing.lastPrice : (cfg.lastPrice || cfg.centerPrice),
    tickCount: existing ? existing.tickCount : 0,
    errorCount: 0,
    timer: null,
    startedAt: existing ? existing.startedAt : Date.now(),
  };
  runtimeStates.set(cfg.symbol, state);
  startTimerForSymbol(state);
  return { active: true, symbol: cfg.symbol, tickIntervalMs: cfg.tickIntervalMs };
}

function removeSymbol(symbol) {
  stopTimerForSymbol(symbol);
  runtimeStates.delete(symbol);
}

function setPrice(symbol, price) {
  const state = runtimeStates.get(symbol);
  if (!state) throw new Error('品种未在自控模式下运行');
  const cfg = state.config;
  const symbolInfo = marketData.getSymbolInfo(symbol);
  if (!symbolInfo) throw new Error('品种信息不可用');
  const range = cfg.upperBound - cfg.lowerBound;
  const pad = range * 0.01;
  const target = clamp(parseFloat(price), cfg.lowerBound - pad, cfg.upperBound + pad);
  const decimals = symbolInfo.price_decimals != null ? Number(symbolInfo.price_decimals) : 2;
  const tickSize = parseFloat(symbolInfo.tick_size) || 0.01;
  const bid = roundToTick(target, tickSize, decimals);
  const ask = parseFloat((bid + resolveSpread(symbolInfo)).toFixed(decimals));
  const current = marketData.getPrice(symbol) || {};
  marketData.priceCache.set(symbol, {
    symbol,
    name: symbolInfo.name,
    category: symbolInfo.category,
    bid,
    ask,
    high: Math.max(current.high || bid, bid),
    low: Math.min(current.low || bid, bid),
    open: current.open || bid,
    prev_close: current.prev_close || bid,
    change: parseFloat((bid - (current.open || bid)).toFixed(decimals)),
    change_percent: current.open ? parseFloat((((bid - current.open) / current.open) * 100).toFixed(4)) : 0,
    volume: (current.volume || 0) + 1,
    timestamp: Date.now(),
  });
  state.lastPrice = bid;
  state.lastTickAt = Date.now();
  return bid;
}

function nudgePrice(symbol, delta) {
  const current = marketData.getPrice(symbol);
  const base = current && current.bid != null ? parseFloat(current.bid) : null;
  if (base == null) throw new Error('当前行情不可用');
  return setPrice(symbol, base + parseFloat(delta));
}

async function resetCenter(symbol) {
  const state = runtimeStates.get(symbol);
  if (!state) throw new Error('品种未在自控模式下运行');
  const current = marketData.getPrice(symbol);
  const price = current && current.bid != null ? parseFloat(current.bid) : state.lastPrice;
  if (price == null) throw new Error('无法获取当前价');
  state.config.centerPrice = price;
  await query(
    'UPDATE symbol_sim_configs SET center_price = ? WHERE symbol_id = ?',
    [price, state.config.symbolId]
  );
  return price;
}

function getSimStatus() {
  const list = [];
  for (const [, state] of runtimeStates) {
    const cfg = state.config;
    const tick = marketData.getPrice(cfg.symbol) || {};
    const bid = tick.bid != null ? parseFloat(tick.bid) : state.lastPrice;
    const range = cfg.upperBound - cfg.lowerBound;
    const edgeDistPct = range > 0 && bid != null
      ? parseFloat(((Math.min(bid - cfg.lowerBound, cfg.upperBound - bid) / range) * 100).toFixed(2))
      : null;
    list.push({
      symbolId: cfg.symbolId,
      symbol: cfg.symbol,
      centerPrice: cfg.centerPrice,
      lowerBound: cfg.lowerBound,
      upperBound: cfg.upperBound,
      trendDirection: cfg.trendDirection,
      trendStrength: cfg.trendStrength,
      volatilityLevel: cfg.volatilityLevel,
      tickIntervalMs: cfg.tickIntervalMs,
      currentBid: bid,
      currentAsk: tick.ask != null ? parseFloat(tick.ask) : null,
      edgeDistancePct: edgeDistPct,
      tickCount: state.tickCount,
      errorCount: state.errorCount || 0,
      lastTickAt: state.lastTickAt || null,
      startedAt: state.startedAt,
    });
  }
  return list;
}

function isRunning(symbol) {
  return runtimeStates.has(symbol);
}

function getRuntimeState(symbol) {
  return runtimeStates.get(symbol) || null;
}

module.exports = {
  start,
  stop,
  ensureSchema,
  reloadConfig,
  removeSymbol,
  setPrice,
  nudgePrice,
  resetCenter,
  getSimStatus,
  isRunning,
  getRuntimeState,
  VOLATILITY_PRESETS,
  KAPPA_PRESETS,
  MIN_TICK_INTERVAL_MS,
  MAX_TICK_INTERVAL_MS,
};
