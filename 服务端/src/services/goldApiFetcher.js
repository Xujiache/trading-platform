const https = require('https');
const marketData = require('./marketDataService');

const BASE_URL = 'https://api.gold-api.com';
const FETCH_INTERVAL = 30000;
const METALS = [
  { api: 'XAU', symbol: 'XAUUSD', decimals: 2 },
  { api: 'XAG', symbol: 'XAGUSD', decimals: 3 },
];

let fetchTimer = null;
let fetchCount = 0;
let errorCount = 0;
let lastFetchTime = null;

function fetchPrice(metal, currency) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}/price/${metal}/${currency}`;
    const req = https.get(url, { timeout: 15000 }, (res) => {
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

async function updateGoldPrices() {
  const { priceCache, symbolsCache } = marketData;
  let updated = 0;

  for (const metal of METALS) {
    try {
      const symbolInfo = symbolsCache.get(metal.symbol);
      if (!symbolInfo) continue;
      // 自控品种不让外部 API 覆盖 priceCache; hybrid 保持真实价为底。
      if (symbolInfo.price_source === 'custom') continue;

      const data = await fetchPrice(metal.api, 'USD');
      if (!data || !data.price) continue;

      const bid = parseFloat(data.price.toFixed(metal.decimals));
      const ask = data.ask ? parseFloat(data.ask.toFixed(metal.decimals)) : bid;
      const change = data.ch ? parseFloat(data.ch.toFixed(metal.decimals)) : 0;
      const changePercent = data.chp ? parseFloat(data.chp.toFixed(2)) : 0;

      const current = priceCache.get(metal.symbol);
      const openPrice = current ? current.open : (bid - change);
      const prevClose = current ? current.prev_close : (bid - change);
      const high = current ? Math.max(current.high, bid) : bid;
      const low = current ? Math.min(current.low, bid) : bid;
      const volume = current ? current.volume + Math.floor(Math.random() * 50) : 0;

      priceCache.set(metal.symbol, {
        symbol: metal.symbol,
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
    } catch (err) {
      errorCount++;
      if (errorCount % 10 === 1) {
        console.error(`[GoldAPI] ${metal.symbol} fetch failed (errors: ${errorCount}): ${err.message}`);
      }
    }
  }

  if (updated > 0) {
    fetchCount++;
    lastFetchTime = Date.now();
    if (fetchCount % 20 === 1) {
      console.log(`[GoldAPI] Updated ${updated} metals (total: ${fetchCount}, errors: ${errorCount})`);
    }
  }
}

function startGoldFetcher() {
  if (fetchTimer) return;
  updateGoldPrices();
  fetchTimer = setInterval(updateGoldPrices, FETCH_INTERVAL);
  console.log(`[GoldAPI] Gold/Silver price fetcher started (interval: ${FETCH_INTERVAL / 1000}s, symbols: ${METALS.map(m => m.symbol).join(',')})`);
}

function stopGoldFetcher() {
  if (fetchTimer) { clearInterval(fetchTimer); fetchTimer = null; }
}

function getStatus() {
  return { running: !!fetchTimer, fetchCount, errorCount, lastFetchTime, symbols: METALS.map(m => m.symbol) };
}

module.exports = { startGoldFetcher, stopGoldFetcher, getStatus };
