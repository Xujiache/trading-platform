const { WebSocketServer } = require('ws');
const marketData = require('./marketDataService');

const MAX_SUBSCRIPTIONS = 50;
const HEARTBEAT_INTERVAL = 30000;
const RATE_LIMIT_PER_SECOND = 10;
const PUSH_INTERVAL = 1000;

const clients = new Map();
let wss = null;
let pushTimer = null;

function initWebSocket(server) {
  wss = new WebSocketServer({ server, path: '/ws/market' });

  wss.on('connection', (ws) => {
    const clientId = `c_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const info = { id: clientId, ws, subscriptions: new Set(), lastPrices: new Map(), msgCount: 0, msgResetTime: Date.now(), isAlive: true };
    clients.set(clientId, info);

    send(ws, { type: 'connected', data: { clientId, maxSubscriptions: MAX_SUBSCRIPTIONS } });

    ws.on('message', (raw) => handleMessage(info, raw));
    ws.on('close', () => clients.delete(clientId));
    ws.on('pong', () => { info.isAlive = true; });
    ws.on('error', () => {});
  });

  const hbTimer = setInterval(() => {
    for (const [id, c] of clients) {
      if (!c.isAlive) { c.ws.terminate(); clients.delete(id); continue; }
      c.isAlive = false;
      c.ws.ping();
    }
  }, HEARTBEAT_INTERVAL);

  pushTimer = setInterval(pushTickUpdates, PUSH_INTERVAL);
  wss.on('close', () => { clearInterval(hbTimer); clearInterval(pushTimer); });
  console.log('[WebSocket] 行情推送服务已启动 (/ws/market)');
  return wss;
}

function handleMessage(info, raw) {
  const now = Date.now();
  if (now - info.msgResetTime > 1000) { info.msgCount = 0; info.msgResetTime = now; }
  if (++info.msgCount > RATE_LIMIT_PER_SECOND) {
    send(info.ws, { type: 'warning', data: { message: '消息速率超限' } }); return;
  }
  let msg;
  try { msg = JSON.parse(raw.toString()); } catch { send(info.ws, { type: 'error', data: { message: '无效JSON' } }); return; }

  if (msg.type === 'subscribe') handleSubscribe(info, msg.data);
  else if (msg.type === 'unsubscribe') handleUnsubscribe(info, msg.data);
  else if (msg.type === 'ping') send(info.ws, { type: 'pong', data: { time: Date.now() } });
  else send(info.ws, { type: 'error', data: { message: `未知类型: ${msg.type}` } });
}

function handleSubscribe(info, data) {
  if (!data?.symbols?.length) { send(info.ws, { type: 'error', data: { message: 'symbols 必须为数组' } }); return; }
  const remaining = MAX_SUBSCRIPTIONS - info.subscriptions.size;
  const newSymbols = data.symbols.filter(s => !info.subscriptions.has(s)).slice(0, remaining);
  const subscribed = [];
  for (const s of newSymbols) {
    if (marketData.getSymbolInfo(s)) {
      info.subscriptions.add(s); subscribed.push(s);
      const tick = marketData.getPrice(s);
      if (tick) send(info.ws, { type: 'tick', data: tick });
    }
  }
  send(info.ws, { type: 'subscribed', data: { symbols: subscribed, total: info.subscriptions.size } });
}

function handleUnsubscribe(info, data) {
  if (!data?.symbols?.length) return;
  const removed = [];
  for (const s of data.symbols) {
    if (info.subscriptions.delete(s)) { info.lastPrices.delete(s); removed.push(s); }
  }
  send(info.ws, { type: 'unsubscribed', data: { symbols: removed, total: info.subscriptions.size } });
}

function pushTickUpdates() {
  for (const [, c] of clients) {
    if (c.ws.readyState !== 1) continue;
    for (const symbol of c.subscriptions) {
      const tick = marketData.getPrice(symbol);
      if (!tick) continue;
      const last = c.lastPrices.get(symbol);
      if (last && last.bid === tick.bid && last.ask === tick.ask) continue;
      c.lastPrices.set(symbol, { bid: tick.bid, ask: tick.ask });
      send(c.ws, { type: 'tick', data: tick });
    }
  }
}

function send(ws, msg) { if (ws.readyState === 1) ws.send(JSON.stringify(msg)); }
function getClientsCount() { return clients.size; }

module.exports = { initWebSocket, getClientsCount, clients };
