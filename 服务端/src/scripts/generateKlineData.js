const mysql = require('mysql2/promise');
const config = require('../config');

const BASE_PRICES = {
  XAUUSD: 2345, XAGUSD: 28.15, USOUSD: 78.35, UKOUSD: 82.50, NGAS: 2.345,
  EURUSD: 1.0852, GBPUSD: 1.2612, USDJPY: 154.35, AUDUSD: 0.6523, USDCAD: 1.3645,
};

const DECIMALS = {
  XAUUSD: 2, XAGUSD: 3, USOUSD: 2, UKOUSD: 2, NGAS: 3,
  EURUSD: 5, GBPUSD: 5, USDJPY: 3, AUDUSD: 5, USDCAD: 5,
};

const VOLATILITY = {
  XAUUSD: 0.006, XAGUSD: 0.008, USOUSD: 0.01, UKOUSD: 0.01, NGAS: 0.015,
  EURUSD: 0.003, GBPUSD: 0.004, USDJPY: 0.003, AUDUSD: 0.004, USDCAD: 0.003,
};

function randomWalk(price, vol, decimals) {
  const change = price * vol * (Math.random() * 2 - 1);
  return parseFloat((price + change).toFixed(decimals));
}

function generateCandle(basePrice, vol, decimals, trendBias = 0) {
  const open = basePrice;
  const move1 = randomWalk(open, vol, decimals);
  const move2 = randomWalk(open, vol, decimals);
  const drift = open * trendBias;
  const close = parseFloat((randomWalk(open, vol * 0.5, decimals) + drift).toFixed(decimals));
  const high = parseFloat(Math.max(open, close, move1, move2).toFixed(decimals));
  const low = parseFloat(Math.min(open, close, move1, move2).toFixed(decimals));
  const volume = Math.floor(1000 + Math.random() * 50000);
  return { open, high, low, close, volume };
}

const PERIODS_CONFIG = [
  { period: '1d', count: 365, intervalMs: 24 * 60 * 60 * 1000 },
  { period: '4h', count: 500, intervalMs: 4 * 60 * 60 * 1000 },
  { period: '1h', count: 720, intervalMs: 60 * 60 * 1000 },
  { period: '30m', count: 500, intervalMs: 30 * 60 * 1000 },
  { period: '15m', count: 500, intervalMs: 15 * 60 * 1000 },
  { period: '5m', count: 500, intervalMs: 5 * 60 * 1000 },
  { period: '1m', count: 500, intervalMs: 60 * 1000 },
  { period: '1w', count: 52, intervalMs: 7 * 24 * 60 * 60 * 1000 },
  { period: '1M', count: 12, intervalMs: 30 * 24 * 60 * 60 * 1000 },
];

/**
 * 为品种生成历史 K 线数据。
 * @param {Connection} connection  mysql2 connection/pool
 * @param {string}     symbol      品种代码
 * @param {Object}     opts
 * @param {number}     [opts.basePrice]   基准价(不传则查 BASE_PRICES)
 * @param {number}     [opts.decimals]    价格小数位
 * @param {number}     [opts.volatility]  每根K线波动率, 0~0.05
 * @param {number}     [opts.trendBias]   每根K线趋势漂移(close = close * (1 + bias)), 可正可负
 * @param {number}     [opts.lowerBound]  软下限, 价格低于会被软夹回
 * @param {number}     [opts.upperBound]  软上限
 * @param {boolean}    [opts.truncate]    是否先清空该品种历史 K 线, 默认 false
 */
async function generateKlineForSymbol(connection, symbol, opts = {}) {
  const basePrice = opts.basePrice != null ? opts.basePrice : BASE_PRICES[symbol];
  const decimals = opts.decimals != null ? opts.decimals : (DECIMALS[symbol] != null ? DECIMALS[symbol] : 2);
  const vol = opts.volatility != null ? opts.volatility : (VOLATILITY[symbol] != null ? VOLATILITY[symbol] : 0.005);
  const trendBias = opts.trendBias != null ? opts.trendBias : 0;
  const lowerBound = opts.lowerBound != null ? opts.lowerBound : null;
  const upperBound = opts.upperBound != null ? opts.upperBound : null;
  if (basePrice == null) return 0;

  if (opts.truncate) {
    await connection.query('DELETE FROM kline_data WHERE symbol = ?', [symbol]);
  }

  let totalInserted = 0;

  for (const { period, count, intervalMs } of PERIODS_CONFIG) {
    const now = Date.now();
    // 起始价在基准价 ±5% 范围内浮动, 使得不同周期首根 K 线自然衔接
    let currentPrice = basePrice * (0.97 + Math.random() * 0.06);
    const batchValues = [];

    for (let i = count; i >= 1; i--) {
      const openTime = new Date(now - i * intervalMs);
      const candle = generateCandle(currentPrice, vol, decimals, trendBias);
      let nextPrice = candle.close;
      // 软边界: 越过边界时概率性回拉
      if (lowerBound != null && nextPrice < lowerBound) {
        nextPrice = parseFloat((lowerBound + (basePrice - lowerBound) * Math.random() * 0.2).toFixed(decimals));
      }
      if (upperBound != null && nextPrice > upperBound) {
        nextPrice = parseFloat((upperBound - (upperBound - basePrice) * Math.random() * 0.2).toFixed(decimals));
      }
      currentPrice = nextPrice;
      const openTimeStr = openTime.toISOString().slice(0, 19).replace('T', ' ');
      batchValues.push([symbol, period, openTimeStr, candle.open, candle.high, candle.low, candle.close, candle.volume]);
    }

    const batchSize = 100;
    for (let i = 0; i < batchValues.length; i += batchSize) {
      const batch = batchValues.slice(i, i + batchSize);
      const placeholders = batch.map(() => '(?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
      const flatValues = batch.flat();
      await connection.query(
        `INSERT IGNORE INTO kline_data (symbol, period, open_time, open_price, high_price, low_price, close_price, volume) VALUES ${placeholders}`,
        flatValues
      );
      totalInserted += batch.length;
    }
  }

  return totalInserted;
}

async function main() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
    });

    console.log('开始生成历史K线模拟数据...');

    const symbols = Object.keys(BASE_PRICES);
    for (const symbol of symbols) {
      const inserted = await generateKlineForSymbol(connection, symbol);
      console.log(`[${symbol}] 生成 ${inserted} 条K线数据`);
    }

    console.log('历史K线数据生成完成');
  } catch (err) {
    console.error(`K线数据生成失败: ${err.message}`);
  } finally {
    if (connection) await connection.end();
  }
}

if (require.main === module) {
  main().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { generateKlineForSymbol, PERIODS_CONFIG };
