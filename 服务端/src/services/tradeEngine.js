const { query, getConnection } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { withLock } = require('../utils/distributedLock');
const feeCalc = require('./feeCalculator');
const accountService = require('./accountService');
const marketData = require('./marketDataService');

function generateOrderNo() {
  const now = new Date();
  const ts = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0');
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `T${ts}${rand}`;
}

async function placeMarketOrder({ userId, accountType = 'demo', symbolId, direction, lots, leverage, stopLoss, takeProfit, trailingStop }) {
  return withLock(`trade:${userId}`, async () => {
    const symbolRows = await query(
      'SELECT * FROM trading_symbols WHERE id = ? AND status = ?',
      [symbolId, 'active']
    );
    if (symbolRows.length === 0) throw new Error('品种不存在或已禁用');
    const symbolInfo = symbolRows[0];

    const price = marketData.getPrice(symbolInfo.symbol);
    if (!price) throw new Error('当前行情不可用，请稍后重试');

    if (lots < parseFloat(symbolInfo.min_lot) || lots > parseFloat(symbolInfo.max_lot)) {
      throw new Error(`手数必须在 ${symbolInfo.min_lot} ~ ${symbolInfo.max_lot} 之间`);
    }
    if (leverage < symbolInfo.min_leverage || leverage > symbolInfo.max_leverage) {
      throw new Error(`杠杆必须在 ${symbolInfo.min_leverage} ~ ${symbolInfo.max_leverage} 之间`);
    }

    const [maxLevCfg] = await query("SELECT config_value FROM system_config WHERE config_key = 'max_leverage'");
    if (maxLevCfg && leverage > parseInt(maxLevCfg.config_value)) {
      throw new Error(`杠杆不能超过系统最大值 ${maxLevCfg.config_value}`);
    }

    const [maxPosCfg] = await query("SELECT config_value FROM system_config WHERE config_key = 'max_position_per_symbol'");
    if (maxPosCfg) {
      const [posSum] = await query(
        "SELECT COALESCE(SUM(lots), 0) as total_lots FROM trade_orders WHERE user_id = ? AND symbol = ? AND status = 'open'",
        [userId, symbolInfo.symbol]
      );
      if (parseFloat(posSum.total_lots) + lots > parseFloat(maxPosCfg.config_value)) {
        throw new Error(`单品种最大持仓${maxPosCfg.config_value}手，当前已持仓${posSum.total_lots}手`);
      }
    }

    const openPrice = direction === 'buy' ? price.ask : price.bid;

    validateStopLossTakeProfit(direction, openPrice, stopLoss, takeProfit);

    const margin = feeCalc.calcMargin(symbolInfo, lots, openPrice, leverage);
    const commission = feeCalc.calcCommission(symbolInfo, lots, openPrice);
    const spreadCost = feeCalc.calcSpreadCost(symbolInfo, lots);

    const account = await accountService.getOrCreateAccount(userId, accountType);
    const balance = parseFloat(account.balance);
    const frozenMargin = parseFloat(account.frozen_margin);
    const floatingPnl = parseFloat(account.floating_pnl);
    const equity = balance + floatingPnl;
    const available = equity - frozenMargin;

    if (margin + commission > available) {
      throw new Error('可用保证金不足');
    }

    const conn = await getConnection();
    try {
      await conn.beginTransaction();

      const orderNo = generateOrderNo();
      const [insertResult] = await conn.execute(
        `INSERT INTO trade_orders (order_no, user_id, account_type, symbol, direction, lots, leverage,
          open_price, stop_loss, take_profit, trailing_stop, trailing_stop_price,
          margin, commission, spread_cost, status, opened_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', NOW())`,
        [
          orderNo, userId, accountType, symbolInfo.symbol, direction, lots, leverage,
          openPrice, stopLoss || null, takeProfit || null,
          trailingStop || null,
          trailingStop ? (direction === 'buy' ? openPrice - trailingStop : openPrice + trailingStop) : null,
          margin, commission, spreadCost,
        ]
      );

      await accountService.freezeMargin(userId, accountType, margin, conn);
      await accountService.deductBalance(userId, accountType, commission, conn);

      await conn.execute(
        `UPDATE fund_accounts SET total_commission = total_commission + ?
         WHERE user_id = ? AND account_type = ?`,
        [commission, userId, accountType]
      );

      const balanceAfter = balance - commission;
      await accountService.recordFlow(
        userId, accountType, insertResult.insertId, 'open',
        -commission, balance, balanceAfter,
        `开仓 ${symbolInfo.symbol} ${direction} ${lots}手 @${openPrice}`,
        conn
      );

      await conn.commit();

      const [order] = await conn.execute('SELECT * FROM trade_orders WHERE id = ?', [insertResult.insertId]);
      return order[0];
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  });
}

async function closePosition(userId, orderId, closeType = 'manual', adminId = null) {
  return withLock(`trade:${userId}`, async () => {
    const orders = await query(
      'SELECT * FROM trade_orders WHERE id = ? AND status = ?',
      [orderId, 'open']
    );
    if (orders.length === 0) throw new Error('持仓不存在');
    const order = orders[0];

    if (!adminId && order.user_id !== userId) {
      throw new Error('无权操作此订单');
    }

    const symbolInfo = marketData.getSymbolInfo(order.symbol);
    if (!symbolInfo) throw new Error('品种信息不可用');

    const price = marketData.getPrice(order.symbol);
    if (!price) throw new Error('当前行情不可用');

    const closePrice = order.direction === 'buy' ? price.bid : price.ask;

    const realizedPnl = feeCalc.calcFloatingPnl(symbolInfo, order.direction, parseFloat(order.lots), parseFloat(order.open_price), closePrice);
    const commissionClose = symbolInfo.fee_mode === 'both_side'
      ? feeCalc.calcCommission(symbolInfo, parseFloat(order.lots), closePrice)
      : 0;
    const netPnl = feeCalc.calcNetPnl(
      realizedPnl,
      parseFloat(order.commission),
      commissionClose,
      parseFloat(order.swap_total),
      parseFloat(order.spread_cost)
    );

    const margin = parseFloat(order.margin);
    const account = await accountService.getOrCreateAccount(order.user_id, order.account_type);
    const balanceBefore = parseFloat(account.balance);

    const conn = await getConnection();
    try {
      await conn.beginTransaction();

      await conn.execute(
        `UPDATE trade_orders SET
          close_price = ?, realized_pnl = ?, net_pnl = ?, commission_close = ?,
          floating_pnl = 0, status = 'closed', close_type = ?, closed_at = NOW(),
          comment = CONCAT(comment, ?)
         WHERE id = ?`,
        [
          closePrice, realizedPnl, netPnl, commissionClose,
          closeType,
          adminId ? ` [管理员${adminId}平仓]` : '',
          orderId,
        ]
      );

      const settlePnl = realizedPnl - commissionClose;
      await accountService.settleOrder(
        order.user_id, order.account_type,
        margin, settlePnl, 0, 0, conn
      );

      const balanceAfter = balanceBefore + margin + settlePnl;
      await accountService.recordFlow(
        order.user_id, order.account_type, orderId, 'close',
        margin + settlePnl, balanceBefore, balanceAfter,
        `平仓 ${order.symbol} ${order.direction} ${order.lots}手 @${closePrice} 盈亏:${realizedPnl}`,
        conn
      );

      await conn.execute(
        `INSERT INTO fund_flows (user_id, account_type, flow_type, amount, balance_before, balance_after, ref_type, ref_id, description) VALUES (?, ?, 'trade_pnl', ?, ?, ?, 'trade_order', ?, ?)`,
        [order.user_id, order.account_type, netPnl, balanceBefore, balanceAfter, orderId, `${order.symbol} ${order.direction === 'buy' ? '做多' : '做空'} ${order.lots}手 盈亏`]
      );

      await conn.commit();

      const [updatedOrder] = await conn.execute('SELECT * FROM trade_orders WHERE id = ?', [orderId]);
      return updatedOrder[0];
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  });
}

async function closeAllPositions(userId, accountType = 'demo') {
  const openOrders = await query(
    'SELECT id FROM trade_orders WHERE user_id = ? AND account_type = ? AND status = ?',
    [userId, accountType, 'open']
  );

  const results = [];
  for (const order of openOrders) {
    try {
      const result = await closePosition(userId, order.id, 'manual');
      results.push({ orderId: order.id, success: true, data: result });
    } catch (err) {
      results.push({ orderId: order.id, success: false, error: err.message });
    }
  }
  return results;
}

async function createPendingOrder({ userId, accountType = 'demo', symbolId, direction, pendingType, lots, leverage, targetPrice, stopLoss, takeProfit, trailingStop, expiredAt }) {
  const symbolRows = await query(
    'SELECT * FROM trading_symbols WHERE id = ? AND status = ?',
    [symbolId, 'active']
  );
  if (symbolRows.length === 0) throw new Error('品种不存在或已禁用');
  const symbolInfo = symbolRows[0];

  if (lots < parseFloat(symbolInfo.min_lot) || lots > parseFloat(symbolInfo.max_lot)) {
    throw new Error(`手数必须在 ${symbolInfo.min_lot} ~ ${symbolInfo.max_lot} 之间`);
  }

  const price = marketData.getPrice(symbolInfo.symbol);
  if (!price) throw new Error('当前行情不可用');

  const currentPrice = direction === 'buy' ? price.ask : price.bid;
  validatePendingPrice(pendingType, targetPrice, currentPrice);

  const orderNo = 'P' + generateOrderNo().substring(1);
  const result = await query(
    `INSERT INTO pending_orders (order_no, user_id, account_type, symbol, direction, pending_type,
      lots, leverage, target_price, stop_loss, take_profit, trailing_stop, status, expired_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
    [
      orderNo, userId, accountType, symbolInfo.symbol, direction, pendingType,
      lots, leverage, targetPrice, stopLoss || null, takeProfit || null,
      trailingStop || null, expiredAt || null,
    ]
  );

  const rows = await query('SELECT * FROM pending_orders WHERE id = ?', [result.insertId]);
  return rows[0];
}

async function cancelPendingOrder(userId, pendingId) {
  const rows = await query(
    'SELECT * FROM pending_orders WHERE id = ? AND user_id = ? AND status = ?',
    [pendingId, userId, 'active']
  );
  if (rows.length === 0) throw new Error('挂单不存在或已完成');

  await query(
    "UPDATE pending_orders SET status = 'cancelled' WHERE id = ?",
    [pendingId]
  );
  return { id: pendingId, status: 'cancelled' };
}

async function updatePendingOrder(userId, pendingId, updates) {
  const rows = await query(
    'SELECT * FROM pending_orders WHERE id = ? AND user_id = ? AND status = ?',
    [pendingId, userId, 'active']
  );
  if (rows.length === 0) throw new Error('挂单不存在或已完成');

  const fields = [];
  const params = [];
  if (updates.targetPrice !== undefined) { fields.push('target_price = ?'); params.push(updates.targetPrice); }
  if (updates.stopLoss !== undefined) { fields.push('stop_loss = ?'); params.push(updates.stopLoss || null); }
  if (updates.takeProfit !== undefined) { fields.push('take_profit = ?'); params.push(updates.takeProfit || null); }
  if (updates.trailingStop !== undefined) { fields.push('trailing_stop = ?'); params.push(updates.trailingStop || null); }
  if (updates.lots !== undefined) { fields.push('lots = ?'); params.push(updates.lots); }

  if (fields.length === 0) throw new Error('没有可更新的字段');

  params.push(pendingId);
  await query(`UPDATE pending_orders SET ${fields.join(', ')} WHERE id = ?`, params);

  const updated = await query('SELECT * FROM pending_orders WHERE id = ?', [pendingId]);
  return updated[0];
}

async function updateStopLossTakeProfit(userId, orderId, stopLoss, takeProfit, trailingStop) {
  return withLock(`trade:${userId}`, async () => {
    const orders = await query(
      'SELECT * FROM trade_orders WHERE id = ? AND user_id = ? AND status = ?',
      [orderId, userId, 'open']
    );
    if (orders.length === 0) throw new Error('持仓不存在');
    const order = orders[0];

    const currentPrice = parseFloat(order.open_price);
    if (stopLoss !== undefined || takeProfit !== undefined) {
      validateStopLossTakeProfit(order.direction, currentPrice, stopLoss, takeProfit);
    }

    const fields = [];
    const params = [];

    if (stopLoss !== undefined) { fields.push('stop_loss = ?'); params.push(stopLoss || null); }
    if (takeProfit !== undefined) { fields.push('take_profit = ?'); params.push(takeProfit || null); }
    if (trailingStop !== undefined) {
      fields.push('trailing_stop = ?');
      params.push(trailingStop || null);
      if (trailingStop) {
        const price = marketData.getPrice(order.symbol);
        const curPrice = order.direction === 'buy' ? price.bid : price.ask;
        const tsPrice = order.direction === 'buy' ? curPrice - trailingStop : curPrice + trailingStop;
        fields.push('trailing_stop_price = ?');
        params.push(tsPrice);
      } else {
        fields.push('trailing_stop_price = NULL');
      }
    }

    if (fields.length === 0) throw new Error('没有可更新的字段');

    params.push(orderId);
    await query(`UPDATE trade_orders SET ${fields.join(', ')} WHERE id = ?`, params);

    const updated = await query('SELECT * FROM trade_orders WHERE id = ?', [orderId]);
    return updated[0];
  });
}

async function adminModifyPrice(orderId, newPrice, adminId) {
  const orders = await query('SELECT * FROM trade_orders WHERE id = ? AND status = ?', [orderId, 'open']);
  if (orders.length === 0) throw new Error('订单不存在');

  await query(
    `UPDATE trade_orders SET open_price = ?, comment = CONCAT(comment, ?) WHERE id = ?`,
    [newPrice, ` [管理员${adminId}改价:${newPrice}]`, orderId]
  );

  const updated = await query('SELECT * FROM trade_orders WHERE id = ?', [orderId]);
  return updated[0];
}

function validateStopLossTakeProfit(direction, openPrice, stopLoss, takeProfit) {
  if (direction === 'buy') {
    if (stopLoss && stopLoss >= openPrice) {
      throw new Error('买入订单止损价必须低于开仓价');
    }
    if (takeProfit && takeProfit <= openPrice) {
      throw new Error('买入订单止盈价必须高于开仓价');
    }
  } else {
    if (stopLoss && stopLoss <= openPrice) {
      throw new Error('卖出订单止损价必须高于开仓价');
    }
    if (takeProfit && takeProfit >= openPrice) {
      throw new Error('卖出订单止盈价必须低于开仓价');
    }
  }
}

function validatePendingPrice(pendingType, targetPrice, currentPrice) {
  switch (pendingType) {
    case 'buy_limit':
      if (targetPrice >= currentPrice) throw new Error('买入限价单目标价必须低于当前价');
      break;
    case 'buy_stop':
      if (targetPrice <= currentPrice) throw new Error('买入止损单目标价必须高于当前价');
      break;
    case 'sell_limit':
      if (targetPrice <= currentPrice) throw new Error('卖出限价单目标价必须高于当前价');
      break;
    case 'sell_stop':
      if (targetPrice >= currentPrice) throw new Error('卖出止损单目标价必须低于当前价');
      break;
  }
}

module.exports = {
  placeMarketOrder,
  closePosition,
  closeAllPositions,
  createPendingOrder,
  cancelPendingOrder,
  updatePendingOrder,
  updateStopLossTakeProfit,
  adminModifyPrice,
  generateOrderNo,
};
