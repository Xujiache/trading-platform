const { query } = require('../config/database');

const symbolsCache = new Map();
const priceCache = new Map();
let lastUpdateTime = null;
let updateInterval = null;

const BASE_PRICES = {
  XAUUSD: { bid: 2345.50, ask: 2346.00, high: 2360.00, low: 2330.00, open: 2340.00, prev_close: 2338.00 },
  XAGUSD: { bid: 28.150, ask: 28.175, high: 28.500, low: 27.800, open: 28.000, prev_close: 27.950 },
  USOUSD: { bid: 78.35, ask: 78.39, high: 79.50, low: 77.20, open: 78.00, prev_close: 77.80 },
  UKOUSD: { bid: 82.50, ask: 82.55, high: 83.60, low: 81.40, open: 82.10, prev_close: 82.00 },
  EURUSD: { bid: 1.08520, ask: 1.08535, high: 1.08900, low: 1.08100, open: 1.08400, prev_close: 1.08350 },
  GBPUSD: { bid: 1.26120, ask: 1.26140, high: 1.26500, low: 1.25700, open: 1.26000, prev_close: 1.25950 },
  USDJPY: { bid: 154.350, ask: 154.370, high: 155.000, low: 153.800, open: 154.200, prev_close: 154.100 },
  AUDUSD: { bid: 0.65230, ask: 0.65248, high: 0.65500, low: 0.64900, open: 0.65100, prev_close: 0.65050 },
  USDCAD: { bid: 1.36450, ask: 1.36470, high: 1.36800, low: 1.36100, open: 1.36300, prev_close: 1.36250 },
  USDCHF: { bid: 0.78560, ask: 0.78580, high: 0.79000, low: 0.78100, open: 0.78400, prev_close: 0.78350 },
  USDCNH: { bid: 6.82200, ask: 6.82400, high: 6.85000, low: 6.80000, open: 6.82000, prev_close: 6.81800 },
  USDHKD: { bid: 7.83100, ask: 7.83200, high: 7.84000, low: 7.82500, open: 7.83000, prev_close: 7.82900 },
  AUDCAD: { bid: 0.89000, ask: 0.89020, high: 0.89500, low: 0.88500, open: 0.89000, prev_close: 0.88950 },
  AUDCHF: { bid: 0.51200, ask: 0.51220, high: 0.51600, low: 0.50800, open: 0.51100, prev_close: 0.51050 },
  AUDJPY: { bid: 100.650, ask: 100.670, high: 101.200, low: 100.100, open: 100.500, prev_close: 100.400 },
};

const VOLATILITY = { precious_metal: 0.0008, energy: 0.0012, forex: 0.0003 };

function randomWalk(value, volatility, decimals) {
  const change = value * volatility * (Math.random() * 2 - 1);
  return parseFloat((value + change).toFixed(decimals));
}

function simulatePrice(symbol, symbolInfo) {
  const current = priceCache.get(symbol) || BASE_PRICES[symbol];
  if (!current) return null;

  const vol = VOLATILITY[symbolInfo.category] || 0.0005;
  const decimals = symbolInfo.price_decimals || 2;
  const spread = parseFloat(symbolInfo.spread_fixed) || 0;
  const tickSize = parseFloat(symbolInfo.tick_size) || 0.01;

  let newBid = randomWalk(current.bid, vol, decimals);
  newBid = Math.round(newBid / tickSize) * tickSize;
  newBid = parseFloat(newBid.toFixed(decimals));

  const spreadValue = spread * tickSize;
  const newAsk = parseFloat((newBid + spreadValue).toFixed(decimals));
  const high = Math.max(current.high, newBid);
  const low = Math.min(current.low, newBid);
  const changeValue = parseFloat((newBid - current.open).toFixed(decimals));
  const changePercent = parseFloat(((changeValue / current.open) * 100).toFixed(2));
  const volume = (current.volume || 0) + Math.floor(Math.random() * 100);

  return {
    symbol, name: symbolInfo.name, category: symbolInfo.category,
    bid: newBid, ask: newAsk, high, low,
    open: current.open, prev_close: current.prev_close,
    change: changeValue, change_percent: changePercent,
    volume, timestamp: Date.now(),
  };
}

async function loadSymbols() {
  try {
    const rows = await query('SELECT * FROM trading_symbols WHERE status = ?', ['active']);
    symbolsCache.clear();
    for (const row of rows) {
      symbolsCache.set(row.symbol, row);
      if (!priceCache.has(row.symbol) && BASE_PRICES[row.symbol]) {
        priceCache.set(row.symbol, { ...BASE_PRICES[row.symbol], volume: 0 });
      }
    }
    console.log(`[MarketData] 加载了 ${rows.length} 个活跃交易品种`);
    return rows;
  } catch (err) {
    console.error(`[MarketData] 加载品种失败: ${err.message}`);
    return [];
  }
}

/**
 * 单品种元数据热刷新: admin 改动 price_source / status 后即时同步。
 * 只覆盖 symbolsCache, 不动 priceCache。
 */
async function refreshSymbol(symbolId) {
  try {
    const rows = await query('SELECT * FROM trading_symbols WHERE id = ?', [symbolId]);
    if (rows.length === 0) return null;
    const row = rows[0];
    if (row.status === 'active') {
      symbolsCache.set(row.symbol, row);
    } else {
      symbolsCache.delete(row.symbol);
    }
    return row;
  } catch (err) {
    console.error(`[MarketData] refreshSymbol(${symbolId}) 失败: ${err.message}`);
    return null;
  }
}

function updateAllPrices() {
  const updates = [];
  for (const [symbol, info] of symbolsCache) {
    // 非 real 品种由 customPriceEngine 或外部 API 接管, 跳过随机游走。
    if (info.price_source && info.price_source !== 'real') continue;
    const tick = simulatePrice(symbol, info);
    if (tick) {
      priceCache.set(symbol, tick);
      updates.push(tick);
    }
  }
  lastUpdateTime = Date.now();
  return updates;
}

function startPriceSimulation(intervalMs = 1000) {
  if (updateInterval) return;
  updateInterval = setInterval(() => { updateAllPrices(); }, intervalMs);
  console.log(`[MarketData] 行情模拟已启动，间隔 ${intervalMs}ms`);
}

function stopPriceSimulation() {
  if (updateInterval) { clearInterval(updateInterval); updateInterval = null; }
}

function getPrice(symbol) { return priceCache.get(symbol) || null; }
function getAllPrices() { return Array.from(priceCache.values()); }
function getSymbolInfo(symbol) { return symbolsCache.get(symbol) || null; }
function getAllSymbolInfos() { return Array.from(symbolsCache.values()); }
function getLastUpdateTime() { return lastUpdateTime; }

module.exports = {
  loadSymbols, refreshSymbol, updateAllPrices, startPriceSimulation, stopPriceSimulation,
  getPrice, getAllPrices, getSymbolInfo, getAllSymbolInfos, getLastUpdateTime,
  symbolsCache, priceCache,
};
