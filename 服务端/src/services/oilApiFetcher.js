const https = require('https');
const marketData = require('./marketDataService');

const API_URL = 'https://api.oilpriceapi.com/v1/demo/prices';
const FETCH_INTERVAL = 180000;
const OIL_MAP = {
  WTI_USD: { symbol: 'USOUSD', decimals: 2 },
  BRENT_CRUDE_USD: { symbol: 'UKOUSD', decimals: 2 },
};

let fetchTimer = null;
let fetchCount = 0;
let errorCount = 0;
let lastFetchTime = null;

function fetchFromApi() {
  return new Promise((resolve, reject) => {
    const req = https.get(API_URL, { timeout: 15000, headers: { 'Content-Type': 'application/json' } }, (res) => {
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

async function updateOilPrices() {
  try {
    const json = await fetchFromApi();
    if (!json || json.status !== 'success' || !json.data || !json.data.prices) {
      errorCount++;
      return;
    }

    const { priceCache, symbolsCache } = marketData;
    let updated = 0;

    for (const item of json.data.prices) {
      const mapping = OIL_MAP[item.code];
      if (!mapping) continue;

      const symbolInfo = symbolsCache.get(mapping.symbol);
      if (!symbolInfo) continue;
      // 自控品种跳过
      if (symbolInfo.price_source === 'custom') continue;

      const bid = parseFloat(item.price.toFixed(mapping.decimals));
      const spreadFixed = parseFloat(symbolInfo.spread_fixed) || 0;
      const tickSize = parseFloat(symbolInfo.tick_size) || 0.01;
      const ask = parseFloat((bid + spreadFixed * tickSize).toFixed(mapping.decimals));

      const current = priceCache.get(mapping.symbol);
      const openPrice = current ? current.open : bid;
      const prevClose = current ? current.prev_close : bid;
      const high = current ? Math.max(current.high, bid) : bid;
      const low = current ? Math.min(current.low, bid) : bid;
      const changeVal = parseFloat((bid - openPrice).toFixed(mapping.decimals));
      const changePct = openPrice !== 0 ? parseFloat(((changeVal / openPrice) * 100).toFixed(2)) : 0;
      const volume = current ? current.volume + Math.floor(Math.random() * 80) : 0;

      priceCache.set(mapping.symbol, {
        symbol: mapping.symbol, name: symbolInfo.name, category: symbolInfo.category,
        bid, ask, high, low,
        open: openPrice, prev_close: prevClose,
        change: changeVal, change_percent: changePct,
        volume, timestamp: Date.now(),
      });
      updated++;
    }

    if (updated > 0) {
      fetchCount++;
      lastFetchTime = Date.now();
      console.log(`[OilAPI] Updated ${updated} oil prices (total: ${fetchCount}, errors: ${errorCount})`);
    }
  } catch (err) {
    errorCount++;
    if (errorCount % 5 === 1) {
      console.error(`[OilAPI] Fetch failed (errors: ${errorCount}): ${err.message}`);
    }
  }
}

function startOilFetcher() {
  if (fetchTimer) return;
  updateOilPrices();
  fetchTimer = setInterval(updateOilPrices, FETCH_INTERVAL);
  console.log(`[OilAPI] Oil price fetcher started (interval: ${FETCH_INTERVAL / 1000}s, symbols: ${Object.values(OIL_MAP).map(m => m.symbol).join(',')})`);
}

function stopOilFetcher() {
  if (fetchTimer) { clearInterval(fetchTimer); fetchTimer = null; }
}

function getStatus() {
  return { running: !!fetchTimer, fetchCount, errorCount, lastFetchTime, symbols: Object.values(OIL_MAP).map(m => m.symbol) };
}

module.exports = { startOilFetcher, stopOilFetcher, getStatus };
