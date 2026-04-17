const { query } = require('../config/database');
const marketData = require('./marketDataService');
const feeCalc = require('./feeCalculator');
const accountService = require('./accountService');
const tradeEngine = require('./tradeEngine');

let updaterInterval = null;

async function updateFloatingPnl() {
  try {
    const openOrders = await query(
      "SELECT * FROM trade_orders WHERE status = 'open'"
    );

    const userPnlMap = new Map();

    for (const order of openOrders) {
      const symbolInfo = marketData.getSymbolInfo(order.symbol);
      const price = marketData.getPrice(order.symbol);
      if (!symbolInfo || !price) continue;

      const currentPrice = order.direction === 'buy' ? price.bid : price.ask;
      const floatingPnl = feeCalc.calcFloatingPnl(
        symbolInfo, order.direction,
        parseFloat(order.lots), parseFloat(order.open_price), currentPrice
      );

      await query(
        'UPDATE trade_orders SET floating_pnl = ? WHERE id = ?',
        [floatingPnl, order.id]
      );

      const key = `${order.user_id}:${order.account_type}`;
      const current = userPnlMap.get(key) || { userId: order.user_id, accountType: order.account_type, totalPnl: 0 };
      current.totalPnl = parseFloat((current.totalPnl + floatingPnl).toFixed(4));
      userPnlMap.set(key, current);

      if (order.stop_loss) {
        const sl = parseFloat(order.stop_loss);
        const shouldClose = order.direction === 'buy'
          ? currentPrice <= sl
          : currentPrice >= sl;
        if (shouldClose) {
          try {
            await tradeEngine.closePosition(order.user_id, order.id, 'stop_loss');
            console.log(`[FloatingPnl] 止损触发 ${order.order_no} @${currentPrice}`);
          } catch (err) {
            console.error(`[FloatingPnl] 止损平仓失败 ${order.order_no}: ${err.message}`);
          }
          continue;
        }
      }

      if (order.take_profit) {
        const tp = parseFloat(order.take_profit);
        const shouldClose = order.direction === 'buy'
          ? currentPrice >= tp
          : currentPrice <= tp;
        if (shouldClose) {
          try {
            await tradeEngine.closePosition(order.user_id, order.id, 'take_profit');
            console.log(`[FloatingPnl] 止盈触发 ${order.order_no} @${currentPrice}`);
          } catch (err) {
            console.error(`[FloatingPnl] 止盈平仓失败 ${order.order_no}: ${err.message}`);
          }
        }
      }
    }

    for (const [, data] of userPnlMap) {
      await accountService.updateFloatingPnl(data.userId, data.accountType, data.totalPnl);
    }

    const staleAccounts = await query(
      "SELECT user_id, account_type FROM fund_accounts WHERE floating_pnl != 0"
    );
    for (const acc of staleAccounts) {
      const key = `${acc.user_id}:${acc.account_type}`;
      if (!userPnlMap.has(key)) {
        await accountService.updateFloatingPnl(acc.user_id, acc.account_type, 0);
      }
    }

    await checkMarginAlerts(userPnlMap);
  } catch (err) {
    console.error('[FloatingPnl] 更新浮动盈亏失败:', err.message);
  }
}

/** 检查保证金比例并生成风险预警，低于强平线自动强平 */
async function checkMarginAlerts(userPnlMap) {
  try {
    const [warningCfg] = await query("SELECT config_value FROM system_config WHERE config_key = 'warning_line'");
    const [forceCfg] = await query("SELECT config_value FROM system_config WHERE config_key = 'force_close_line'");
    const warningLine = parseFloat(warningCfg?.config_value || '50');
    const forceCloseLine = parseFloat(forceCfg?.config_value || '20');

    for (const [, data] of userPnlMap) {
      const [account] = await query(
        'SELECT balance, frozen_margin, floating_pnl FROM fund_accounts WHERE user_id = ? AND account_type = ?',
        [data.userId, data.accountType]
      );
      if (!account || parseFloat(account.frozen_margin) <= 0) continue;

      const equity = parseFloat(account.balance) + parseFloat(account.floating_pnl);
      const marginRatio = (equity / parseFloat(account.frozen_margin)) * 100;

      if (marginRatio <= forceCloseLine) {
        const openOrders = await query(
          "SELECT id FROM trade_orders WHERE user_id = ? AND account_type = ? AND status = 'open'",
          [data.userId, data.accountType]
        );
        for (const order of openOrders) {
          try {
            const result = await tradeEngine.closePosition(data.userId, order.id, 'force_close');
            await query(
              `INSERT INTO force_close_records (user_id, order_id, trigger_type, trigger_reason, margin_ratio, close_price, realized_pnl)
               VALUES (?, ?, 'system', '保证金比例低于强平线', ?, ?, ?)`,
              [data.userId, order.id, marginRatio.toFixed(4), result?.close_price || 0, result?.realized_pnl || 0]
            );
          } catch (e) {
            console.error(`[ForceClose] 系统强平失败 userId=${data.userId} orderId=${order.id}: ${e.message}`);
          }
        }
        await query(
          `INSERT INTO risk_alerts (user_id, alert_type, level, title, content, margin_ratio)
           VALUES (?, 'margin_danger', 'critical', '系统强平', ?, ?)`,
          [data.userId, `保证金比例${marginRatio.toFixed(2)}%低于强平线${forceCloseLine}%，已执行系统强平`, marginRatio.toFixed(4)]
        );
        console.log(`[ForceClose] 系统强平 userId=${data.userId} marginRatio=${marginRatio.toFixed(2)}%`);
      } else if (marginRatio <= warningLine) {
        const [recent] = await query(
          `SELECT id FROM risk_alerts WHERE user_id = ? AND alert_type = 'margin_warning' AND status = 'pending'
           AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)`, [data.userId]
        );
        if (!recent) {
          await query(
            `INSERT INTO risk_alerts (user_id, alert_type, level, title, content, margin_ratio)
             VALUES (?, 'margin_warning', 'high', '保证金预警', ?, ?)`,
            [data.userId, `保证金比例${marginRatio.toFixed(2)}%低于预警线${warningLine}%`, marginRatio.toFixed(4)]
          );
        }
      }
    }
  } catch (err) {
    console.error('[MarginAlert] 保证金预警检查失败:', err.message);
  }
}

function startFloatingPnlUpdater(intervalMs = 3000) {
  if (updaterInterval) return;
  updaterInterval = setInterval(updateFloatingPnl, intervalMs);
  console.log(`[FloatingPnl] 浮动盈亏更新已启动，间隔 ${intervalMs}ms`);
}

function stopFloatingPnlUpdater() {
  if (updaterInterval) { clearInterval(updaterInterval); updaterInterval = null; }
}

module.exports = { startFloatingPnlUpdater, stopFloatingPnlUpdater, updateFloatingPnl };
