const { query } = require('../config/database');
const marketData = require('./marketDataService');

const PERIODS = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w', '1M'];
const currentKlines = new Map();
const klineCache = new Map();
let klineTimer = null;

const PERIOD_TTL = { '1m': 30000, '5m': 150000, '15m': 450000, '30m': 900000, '1h': 1800000, '4h': 7200000, '1d': 43200000, '1w': 302400000, '1M': 1296000000 };

function getKlineOpenTime(timestamp, period) {
  const d = new Date(timestamp);
  switch (period) {
    case '1m': d.setSeconds(0, 0); return d;
    case '5m': d.setMinutes(Math.floor(d.getMinutes() / 5) * 5, 0, 0); return d;
    case '15m': d.setMinutes(Math.floor(d.getMinutes() / 15) * 15, 0, 0); return d;
    case '30m': d.setMinutes(Math.floor(d.getMinutes() / 30) * 30, 0, 0); return d;
    case '1h': d.setMinutes(0, 0, 0); return d;
    case '4h': d.setHours(Math.floor(d.getHours() / 4) * 4, 0, 0, 0); return d;
    case '1d': d.setHours(0, 0, 0, 0); return d;
    case '1w': d.setDate(d.getDate() - d.getDay()); d.setHours(0, 0, 0, 0); return d;
    case '1M': d.setDate(1); d.setHours(0, 0, 0, 0); return d;
    default: return d;
  }
}

function updateCurrentKline(symbol, price, period) {
  const key = `${symbol}_${period}`;
  const openTime = getKlineOpenTime(Date.now(), period);
  const openTimeStr = openTime.toISOString().slice(0, 19).replace('T', ' ');
  let kline = currentKlines.get(key);

  if (!kline || kline.open_time !== openTimeStr) {
    if (kline && kline.open_time !== openTimeStr) saveKline(kline).catch(() => {});
    kline = { symbol, period, open_time: openTimeStr, open_price: price, high_price: price, low_price: price, close_price: price, volume: 0 };
    currentKlines.set(key, kline);
  } else {
    kline.close_price = price;
    if (price > kline.high_price) kline.high_price = price;
    if (price < kline.low_price) kline.low_price = price;
    kline.volume += Math.floor(Math.random() * 10);
  }
  return kline;
}

async function saveKline(kline) {
  const sql = `INSERT INTO kline_data (symbol,period,open_time,open_price,high_price,low_price,close_price,volume) VALUES (?,?,?,?,?,?,?,?)
    ON DUPLICATE KEY UPDATE high_price=GREATEST(high_price,VALUES(high_price)),low_price=LEAST(low_price,VALUES(low_price)),close_price=VALUES(close_price),volume=VALUES(volume)`;
  await query(sql, [kline.symbol, kline.period, kline.open_time, kline.open_price, kline.high_price, kline.low_price, kline.close_price, kline.volume]);
}

function processKlineUpdate() {
  const prices = marketData.getAllPrices();
  for (const tick of prices) {
    for (const p of ['1m', '5m', '15m', '1h']) updateCurrentKline(tick.symbol, tick.bid, p);
  }
}

function startKlineService(intervalMs = 5000) {
  if (klineTimer) return;
  klineTimer = setInterval(processKlineUpdate, intervalMs);
  console.log('[Kline] K线数据服务已启动');
}

function stopKlineService() {
  if (klineTimer) { clearInterval(klineTimer); klineTimer = null; }
  for (const [, kline] of currentKlines) saveKline(kline).catch(() => {});
}

async function getKlineData(symbol, period, limit = 200, startTime, endTime) {
  if (!PERIODS.includes(period)) throw new Error(`无效K线周期: ${period}`);

  const cacheKey = `${symbol}_${period}_${limit}_${startTime || ''}_${endTime || ''}`;
  const cached = klineCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < (PERIOD_TTL[period] || 30000)) {
    return cached.data.slice();
  }

  let sql = 'SELECT open_time, open_price, high_price, low_price, close_price, volume FROM kline_data WHERE symbol = ? AND period = ?';
  const params = [symbol, period];
  if (startTime) { sql += ' AND open_time >= ?'; params.push(startTime); }
  if (endTime) { sql += ' AND open_time <= ?'; params.push(endTime); }
  sql += ' ORDER BY open_time DESC LIMIT ?';
  params.push(parseInt(limit));
  const rows = await query(sql, params);
  const result = rows.reverse();

  klineCache.set(cacheKey, { data: result, ts: Date.now() });

  return result;
}

function getCurrentKline(symbol, period) { return currentKlines.get(`${symbol}_${period}`) || null; }

module.exports = { startKlineService, stopKlineService, getKlineData, getCurrentKline, PERIODS };
