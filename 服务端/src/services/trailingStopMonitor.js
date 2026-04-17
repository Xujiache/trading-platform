const { query } = require('../config/database');
const marketData = require('./marketDataService');
const tradeEngine = require('./tradeEngine');

let monitorInterval = null;

async function checkTrailingStops() {
  try {
    const orders = await query(
      "SELECT * FROM trade_orders WHERE status = 'open' AND trailing_stop IS NOT NULL"
    );

    for (const order of orders) {
      const price = marketData.getPrice(order.symbol);
      if (!price) continue;

      const trailingDistance = parseFloat(order.trailing_stop);
      const currentBid = price.bid;
      const currentAsk = price.ask;
      let currentTsPrice = order.trailing_stop_price ? parseFloat(order.trailing_stop_price) : null;

      if (order.direction === 'buy') {
        const newTsPrice = currentBid - trailingDistance;
        if (!currentTsPrice || newTsPrice > currentTsPrice) {
          await query(
            'UPDATE trade_orders SET trailing_stop_price = ? WHERE id = ?',
            [newTsPrice, order.id]
          );
          currentTsPrice = newTsPrice;
        }

        if (currentTsPrice && currentBid <= currentTsPrice) {
          try {
            await tradeEngine.closePosition(order.user_id, order.id, 'trailing_stop');
            console.log(`[TrailingStop] 订单 ${order.order_no} 移动止损触发平仓 @${currentBid}`);
          } catch (err) {
            console.error(`[TrailingStop] 平仓失败 ${order.order_no}: ${err.message}`);
          }
        }
      } else {
        const newTsPrice = currentAsk + trailingDistance;
        if (!currentTsPrice || newTsPrice < currentTsPrice) {
          await query(
            'UPDATE trade_orders SET trailing_stop_price = ? WHERE id = ?',
            [newTsPrice, order.id]
          );
          currentTsPrice = newTsPrice;
        }

        if (currentTsPrice && currentAsk >= currentTsPrice) {
          try {
            await tradeEngine.closePosition(order.user_id, order.id, 'trailing_stop');
            console.log(`[TrailingStop] 订单 ${order.order_no} 移动止损触发平仓 @${currentAsk}`);
          } catch (err) {
            console.error(`[TrailingStop] 平仓失败 ${order.order_no}: ${err.message}`);
          }
        }
      }
    }
  } catch (err) {
    console.error('[TrailingStop] 检查移动止损失败:', err.message);
  }
}

function startTrailingStopMonitor(intervalMs = 2000) {
  if (monitorInterval) return;
  monitorInterval = setInterval(checkTrailingStops, intervalMs);
  console.log(`[TrailingStop] 移动止损监控已启动，间隔 ${intervalMs}ms`);
}

function stopTrailingStopMonitor() {
  if (monitorInterval) { clearInterval(monitorInterval); monitorInterval = null; }
}

module.exports = { startTrailingStopMonitor, stopTrailingStopMonitor, checkTrailingStops };
