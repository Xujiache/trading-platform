const { query } = require('../config/database');
const marketData = require('./marketDataService');
const tradeEngine = require('./tradeEngine');

let monitorInterval = null;

async function checkPendingOrders() {
  try {
    const pendingOrders = await query(
      "SELECT po.*, ts.id as symbol_id FROM pending_orders po JOIN trading_symbols ts ON po.symbol = ts.symbol WHERE po.status = 'active'"
    );

    for (const pending of pendingOrders) {
      if (pending.expired_at && new Date(pending.expired_at) < new Date()) {
        await query("UPDATE pending_orders SET status = 'expired' WHERE id = ?", [pending.id]);
        continue;
      }

      const price = marketData.getPrice(pending.symbol);
      if (!price) continue;

      const shouldTrigger = checkTriggerCondition(pending, price);
      if (!shouldTrigger) continue;

      try {
        const order = await tradeEngine.placeMarketOrder({
          userId: pending.user_id,
          accountType: pending.account_type,
          symbolId: pending.symbol_id,
          direction: pending.direction,
          lots: parseFloat(pending.lots),
          leverage: pending.leverage,
          stopLoss: pending.stop_loss ? parseFloat(pending.stop_loss) : null,
          takeProfit: pending.take_profit ? parseFloat(pending.take_profit) : null,
          trailingStop: pending.trailing_stop ? parseFloat(pending.trailing_stop) : null,
        });

        await query(
          "UPDATE pending_orders SET status = 'triggered', triggered_order_id = ?, triggered_at = NOW() WHERE id = ?",
          [order.id, pending.id]
        );
        console.log(`[PendingMonitor] 挂单 ${pending.order_no} 触发成功，生成订单 ${order.order_no}`);
      } catch (err) {
        console.error(`[PendingMonitor] 挂单 ${pending.order_no} 触发失败: ${err.message}`);
      }
    }
  } catch (err) {
    console.error('[PendingMonitor] 检查挂单失败:', err.message);
  }
}

function checkTriggerCondition(pending, price) {
  const targetPrice = parseFloat(pending.target_price);
  const { bid, ask } = price;

  switch (pending.pending_type) {
    case 'buy_limit':
      return ask <= targetPrice;
    case 'buy_stop':
      return ask >= targetPrice;
    case 'sell_limit':
      return bid >= targetPrice;
    case 'sell_stop':
      return bid <= targetPrice;
    default:
      return false;
  }
}

function startPendingOrderMonitor(intervalMs = 2000) {
  if (monitorInterval) return;
  monitorInterval = setInterval(checkPendingOrders, intervalMs);
  console.log(`[PendingMonitor] 挂单监控已启动，间隔 ${intervalMs}ms`);
}

function stopPendingOrderMonitor() {
  if (monitorInterval) {
    clearInterval(monitorInterval);
    monitorInterval = null;
  }
}

module.exports = { startPendingOrderMonitor, stopPendingOrderMonitor, checkPendingOrders };
