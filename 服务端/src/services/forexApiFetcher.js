const https = require('https');
const marketData = require('./marketDataService');

const API_URL = 'https://www.freeforexapi.com/api/live?pairs=EURUSD,GBPUSD,USDJPY,AUDUSD,USDCAD,USDCHF,USDCNH,USDHKD';
const FETCH_INTERVAL = 30000;
const FOREX_SYMBOLS = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'USDCHF', 'USDCNH', 'USDHKD'];
const CROSS_PAIRS = [
  { symbol: 'AUDCAD', base: 'AUDUSD', quote: 'USDCAD', decimals: 5 },
  { symbol: 'AUDCHF', base: 'AUDUSD', quote: 'USDCHF', decimals: 5 },
  { symbol: 'AUDJPY', base: 'AUDUSD', quote: 'USDJPY', decimals: 3 },
];

let fetchTimer = null;
let lastFetchTime = null;
let fetchCount = 0;
let errorCount = 0;

function fetchFromApi() {
  return new Promise((resolve, reject) => {
    const req = https.get(API_URL, { timeout: 20000 }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          reject(new Error(`JSON parse error: ${e.message}`));
        }
      });
    });
    req.on('error', (e) => reject(e));
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
  });
}

async function updateForexPrices() {
  try {
    const json = await fetchFromApi();
    if (!json || !json.rates) {
      console.error('[ForexAPI] Invalid response structure');
      errorCount++;
      return;
    }

    const { priceCache, symbolsCache } = marketData;
    let updated = 0;

    for (const symbol of FOREX_SYMBOLS) {
      const rateData = json.rates[symbol];
      if (!rateData || !rateData.rate) continue;

      const symbolInfo = symbolsCache.get(symbol);
      if (!symbolInfo) continue;
      // 自控品种跳过外部真实价覆盖
      if (symbolInfo.price_source === 'custom') continue;

      const rate = rateData.rate;
      const decimals = symbolInfo.price_decimals || 5;
      const spreadFixed = parseFloat(symbolInfo.spread_fixed) || 0;
      const tickSize = parseFloat(symbolInfo.tick_size) || 0.00001;

      const bid = parseFloat(rate.toFixed(decimals));
      const spreadValue = spreadFixed * tickSize;
      const ask = parseFloat((bid + spreadValue).toFixed(decimals));

      const current = priceCache.get(symbol);
      const openPrice = current ? current.open : bid;
      const prevClose = current ? current.prev_close : bid;
      const high = current ? Math.max(current.high, bid) : bid;
      const low = current ? Math.min(current.low, bid) : bid;
      const change = parseFloat((bid - openPrice).toFixed(decimals));
      const changePercent = parseFloat(((change / openPrice) * 100).toFixed(2));
      const volume = current ? current.volume + Math.floor(Math.random() * 50) : 0;

      priceCache.set(symbol, {
        symbol,
        name: symbolInfo.name,
        category: symbolInfo.category,
        bid, ask, high, low,
        open: openPrice,
        prev_close: prevClose,
        change, change_percent: changePercent,
        volume,
        timestamp: Date.now(),
      });
      updated++;
    }

    for (const cross of CROSS_PAIRS) {
      const basePrice = priceCache.get(cross.base);
      const quotePrice = priceCache.get(cross.quote);
      if (!basePrice || !quotePrice) continue;

      const symbolInfo = symbolsCache.get(cross.symbol);
      if (!symbolInfo) continue;
      if (symbolInfo.price_source === 'custom') continue;

      const crossRate = parseFloat((basePrice.bid * quotePrice.bid).toFixed(cross.decimals));
      const spreadFixed = parseFloat(symbolInfo.spread_fixed) || 0;
      const tickSize = parseFloat(symbolInfo.tick_size) || 0.00001;
      const crossAsk = parseFloat((crossRate + spreadFixed * tickSize).toFixed(cross.decimals));

      const currentCross = priceCache.get(cross.symbol);
      const openPrice = currentCross ? currentCross.open : crossRate;
      const prevClose = currentCross ? currentCross.prev_close : crossRate;
      const high = currentCross ? Math.max(currentCross.high, crossRate) : crossRate;
      const low = currentCross ? Math.min(currentCross.low, crossRate) : crossRate;
      const change = parseFloat((crossRate - openPrice).toFixed(cross.decimals));
      const changePercent = openPrice !== 0 ? parseFloat(((change / openPrice) * 100).toFixed(2)) : 0;
      const volume = currentCross ? currentCross.volume + Math.floor(Math.random() * 30) : 0;

      priceCache.set(cross.symbol, {
        symbol: cross.symbol, name: symbolInfo.name, category: symbolInfo.category,
        bid: crossRate, ask: crossAsk, high, low,
        open: openPrice, prev_close: prevClose,
        change, change_percent: changePercent, volume, timestamp: Date.now(),
      });
      updated++;
    }

    fetchCount++;
    lastFetchTime = Date.now();
    if (fetchCount % 20 === 1) {
      console.log(`[ForexAPI] Fetched ${updated} forex prices (total: ${fetchCount}, errors: ${errorCount})`);
    }
  } catch (err) {
    errorCount++;
    if (errorCount % 10 === 1) {
      console.error(`[ForexAPI] Fetch failed (errors: ${errorCount}): ${err.message}`);
    }
  }
}

function startForexFetcher() {
  if (fetchTimer) return;
  updateForexPrices();
  fetchTimer = setInterval(updateForexPrices, FETCH_INTERVAL);
  console.log(`[ForexAPI] Forex price fetcher started (interval: ${FETCH_INTERVAL / 1000}s, symbols: ${FOREX_SYMBOLS.join(',')})`);
}

function stopForexFetcher() {
  if (fetchTimer) { clearInterval(fetchTimer); fetchTimer = null; }
}

function getStatus() {
  return { running: !!fetchTimer, fetchCount, errorCount, lastFetchTime, symbols: FOREX_SYMBOLS };
}

module.exports = { startForexFetcher, stopForexFetcher, getStatus };
