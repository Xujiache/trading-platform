const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const { authenticateToken } = require('../../middleware/auth');
const ApiResponse = require('../../utils/response');
const { query } = require('../../config/database');
const tradeEngine = require('../../services/tradeEngine');
const accountService = require('../../services/accountService');
const feeCalc = require('../../services/feeCalculator');
const marketData = require('../../services/marketDataService');

router.use(authenticateToken);

router.get('/symbols', async (req, res) => {
  try {
    const symbols = marketData.getAllSymbolInfos().filter(s => s.status === 'active');
    const result = symbols.map(s => {
      const tick = marketData.getPrice(s.symbol) || {};
      return {
        id: s.id, symbol: s.symbol, name: s.name, category: s.category,
        bid: tick.bid || 0, ask: tick.ask || 0,
        min_lot: parseFloat(s.min_lot), max_lot: parseFloat(s.max_lot),
        lot_step: parseFloat(s.lot_step),
        min_leverage: s.min_leverage, max_leverage: s.max_leverage,
        price_decimals: s.price_decimals,
      };
    });
    ApiResponse.success(res, result);
  } catch (err) {
    ApiResponse.error(res, '获取交易品种列表失败');
  }
});

router.post('/order', [
  body('symbolId').isInt({ min: 1 }).withMessage('品种ID无效'),
  body('direction').isIn(['buy', 'sell']).withMessage('方向无效'),
  body('lots').isFloat({ min: 0.01 }).withMessage('手数无效'),
  body('leverage').isInt({ min: 1 }).withMessage('杠杆无效'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return ApiResponse.badRequest(res, errors.array()[0].msg);

  try {
    const { symbolId, direction, lots, leverage, stopLoss, takeProfit, trailingStop, accountType = 'demo' } = req.body;
    const order = await tradeEngine.placeMarketOrder({
      userId: req.user.id, accountType, symbolId, direction,
      lots: parseFloat(lots), leverage: parseInt(leverage),
      stopLoss: stopLoss ? parseFloat(stopLoss) : null,
      takeProfit: takeProfit ? parseFloat(takeProfit) : null,
      trailingStop: trailingStop ? parseFloat(trailingStop) : null,
    });
    ApiResponse.created(res, order, '下单成功');
  } catch (err) {
    ApiResponse.badRequest(res, err.message);
  }
});

router.post('/pending', [
  body('symbolId').isInt({ min: 1 }).withMessage('品种ID无效'),
  body('direction').isIn(['buy', 'sell']).withMessage('方向无效'),
  body('pendingType').isIn(['buy_limit', 'buy_stop', 'sell_limit', 'sell_stop']).withMessage('挂单类型无效'),
  body('lots').isFloat({ min: 0.01 }).withMessage('手数无效'),
  body('leverage').isInt({ min: 1 }).withMessage('杠杆无效'),
  body('targetPrice').isFloat({ min: 0 }).withMessage('目标价格无效'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return ApiResponse.badRequest(res, errors.array()[0].msg);

  try {
    const { symbolId, direction, pendingType, lots, leverage, targetPrice, stopLoss, takeProfit, trailingStop, accountType = 'demo', expiredAt } = req.body;
    const pending = await tradeEngine.createPendingOrder({
      userId: req.user.id, accountType, symbolId, direction, pendingType,
      lots: parseFloat(lots), leverage: parseInt(leverage),
      targetPrice: parseFloat(targetPrice),
      stopLoss: stopLoss ? parseFloat(stopLoss) : null,
      takeProfit: takeProfit ? parseFloat(takeProfit) : null,
      trailingStop: trailingStop ? parseFloat(trailingStop) : null,
      expiredAt: expiredAt || null,
    });
    ApiResponse.created(res, pending, '挂单创建成功');
  } catch (err) {
    ApiResponse.badRequest(res, err.message);
  }
});

router.post('/close/:id', [
  param('id').isInt({ min: 1 }).withMessage('订单ID无效'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return ApiResponse.badRequest(res, errors.array()[0].msg);

  try {
    const result = await tradeEngine.closePosition(req.user.id, parseInt(req.params.id), 'manual');
    ApiResponse.success(res, result, '平仓成功');
  } catch (err) {
    ApiResponse.badRequest(res, err.message);
  }
});

router.post('/close-all', async (req, res) => {
  try {
    const { accountType = 'demo' } = req.body;
    const results = await tradeEngine.closeAllPositions(req.user.id, accountType);
    const successCount = results.filter(r => r.success).length;
    ApiResponse.success(res, { results, total: results.length, success: successCount }, `一键平仓完成，成功${successCount}笔`);
  } catch (err) {
    ApiResponse.error(res, err.message);
  }
});

router.put('/order/:id/sltp', [
  param('id').isInt({ min: 1 }).withMessage('订单ID无效'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return ApiResponse.badRequest(res, errors.array()[0].msg);

  try {
    const { stopLoss, takeProfit, trailingStop } = req.body;
    const result = await tradeEngine.updateStopLossTakeProfit(
      req.user.id, parseInt(req.params.id),
      stopLoss !== undefined ? (stopLoss ? parseFloat(stopLoss) : null) : undefined,
      takeProfit !== undefined ? (takeProfit ? parseFloat(takeProfit) : null) : undefined,
      trailingStop !== undefined ? (trailingStop ? parseFloat(trailingStop) : null) : undefined,
    );
    ApiResponse.success(res, result, '止损止盈修改成功');
  } catch (err) {
    ApiResponse.badRequest(res, err.message);
  }
});

router.put('/pending/:id', [
  param('id').isInt({ min: 1 }).withMessage('挂单ID无效'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return ApiResponse.badRequest(res, errors.array()[0].msg);

  try {
    const result = await tradeEngine.updatePendingOrder(req.user.id, parseInt(req.params.id), req.body);
    ApiResponse.success(res, result, '挂单修改成功');
  } catch (err) {
    ApiResponse.badRequest(res, err.message);
  }
});

router.delete('/pending/:id', [
  param('id').isInt({ min: 1 }).withMessage('挂单ID无效'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return ApiResponse.badRequest(res, errors.array()[0].msg);

  try {
    const result = await tradeEngine.cancelPendingOrder(req.user.id, parseInt(req.params.id));
    ApiResponse.success(res, result, '挂单已撤销');
  } catch (err) {
    ApiResponse.badRequest(res, err.message);
  }
});

router.get('/positions', async (req, res) => {
  try {
    const { accountType = 'demo' } = req.query;
    const positions = await query(
      `SELECT o.*, ts.name as symbol_name, ts.price_decimals, ts.category
       FROM trade_orders o
       JOIN trading_symbols ts ON o.symbol = ts.symbol
       WHERE o.user_id = ? AND o.account_type = ? AND o.status = 'open'
       ORDER BY o.opened_at DESC`,
      [req.user.id, accountType]
    );

    const result = positions.map(p => {
      const tick = marketData.getPrice(p.symbol) || {};
      return {
        ...p,
        currentPrice: p.direction === 'buy' ? tick.bid : tick.ask,
        bid: tick.bid || 0, ask: tick.ask || 0,
      };
    });
    ApiResponse.success(res, result);
  } catch (err) {
    ApiResponse.error(res, '获取持仓列表失败');
  }
});

router.get('/orders', async (req, res) => {
  try {
    const { accountType = 'demo', status, page = 1, pageSize = 20 } = req.query;
    const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(pageSize);

    const includeCancelledPendings = status && status.includes('cancelled');

    const conditions = ['o.user_id = ?', 'o.account_type = ?'];
    const params = [req.user.id, accountType];

    if (status) {
      const statuses = status.split(',').map(s => s.trim()).filter(s => s);
      if (statuses.length === 1) {
        conditions.push('o.status = ?'); params.push(statuses[0]);
      } else if (statuses.length > 1) {
        conditions.push(`o.status IN (${statuses.map(() => '?').join(',')})`);
        params.push(...statuses);
      }
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    let orders = [];
    let total = 0;

    if (includeCancelledPendings) {
      const unionSql = `
        SELECT * FROM (
          SELECT o.id, o.order_no, o.user_id, o.account_type, o.symbol, o.direction,
            o.lots, o.leverage, o.open_price, o.close_price, o.stop_loss, o.take_profit,
            o.margin, o.commission, o.commission_close, o.swap_total, o.spread_cost,
            o.floating_pnl, o.realized_pnl, o.net_pnl, o.status, o.close_type,
            o.opened_at, o.closed_at, o.created_at,
            ts.name as symbol_name, ts.price_decimals, ts.category,
            'order' as record_type
          FROM trade_orders o
          JOIN trading_symbols ts ON o.symbol = ts.symbol
          ${where}
          UNION ALL
          SELECT po.id + 10000000 as id, po.order_no, po.user_id, po.account_type, po.symbol, po.direction,
            po.lots, po.leverage, po.target_price as open_price, NULL as close_price,
            po.stop_loss, po.take_profit,
            0 as margin, 0 as commission, 0 as commission_close, 0 as swap_total, 0 as spread_cost,
            0 as floating_pnl, NULL as realized_pnl, NULL as net_pnl,
            po.status, NULL as close_type,
            po.created_at as opened_at, po.updated_at as closed_at, po.created_at,
            ts2.name as symbol_name, ts2.price_decimals, ts2.category,
            'pending' as record_type
          FROM pending_orders po
          JOIN trading_symbols ts2 ON po.symbol = ts2.symbol
          WHERE po.user_id = ? AND po.account_type = ? AND po.status IN ('cancelled', 'expired')
        ) combined ORDER BY created_at DESC LIMIT ? OFFSET ?`;

      const countSql = `
        SELECT (
          (SELECT COUNT(*) FROM trade_orders o ${where}) +
          (SELECT COUNT(*) FROM pending_orders WHERE user_id = ? AND account_type = ? AND status IN ('cancelled', 'expired'))
        ) as total`;

      const countResult = await query(countSql, [...params, req.user.id, accountType]);
      total = countResult[0].total;

      orders = await query(unionSql, [...params, req.user.id, accountType, parseInt(pageSize), offset]);
    } else {
      const countResult = await query(`SELECT COUNT(*) as total FROM trade_orders o ${where}`, params);
      total = countResult[0].total;

      orders = await query(
        `SELECT o.*, ts.name as symbol_name, ts.price_decimals, ts.category
         FROM trade_orders o
         JOIN trading_symbols ts ON o.symbol = ts.symbol
         ${where}
         ORDER BY o.created_at DESC LIMIT ? OFFSET ?`,
        [...params, parseInt(pageSize), offset]
      );
    }

    ApiResponse.paginate(res, { list: orders, total, page: parseInt(page), pageSize: parseInt(pageSize) });
  } catch (err) {
    ApiResponse.error(res, '获取订单列表失败');
  }
});

router.get('/orders/:id', [
  param('id').isInt({ min: 1 }).withMessage('订单ID无效'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return ApiResponse.badRequest(res, errors.array()[0].msg);

  try {
    const requestId = parseInt(req.params.id);
    const recordType = req.query.record_type || '';
    const PENDING_ID_OFFSET = 10000000;

    if (recordType === 'pending' || requestId > PENDING_ID_OFFSET) {
      const realPendingId = requestId > PENDING_ID_OFFSET ? requestId - PENDING_ID_OFFSET : requestId;
      const pendings = await query(
        `SELECT po.*, ts.name as symbol_name, ts.price_decimals, ts.category, ts.contract_unit
         FROM pending_orders po
         JOIN trading_symbols ts ON po.symbol = ts.symbol
         WHERE po.id = ? AND po.user_id = ?`,
        [realPendingId, req.user.id]
      );
      if (pendings.length === 0) return ApiResponse.notFound(res, '挂单记录不存在');

      const pending = pendings[0];
      const result = {
        id: requestId,
        order_no: pending.order_no,
        user_id: pending.user_id,
        account_type: pending.account_type,
        symbol: pending.symbol,
        symbol_name: pending.symbol_name,
        direction: pending.direction,
        lots: pending.lots,
        leverage: pending.leverage,
        open_price: pending.target_price,
        close_price: null,
        stop_loss: pending.stop_loss,
        take_profit: pending.take_profit,
        trailing_stop: pending.trailing_stop,
        margin: 0, commission: 0, commission_close: 0,
        swap_total: 0, spread_cost: 0,
        floating_pnl: 0, realized_pnl: null, net_pnl: null,
        status: pending.status,
        close_type: null,
        pending_type: pending.pending_type,
        target_price: pending.target_price,
        expired_at: pending.expired_at,
        opened_at: pending.created_at,
        closed_at: pending.updated_at,
        created_at: pending.created_at,
        record_type: 'pending',
        price_decimals: pending.price_decimals,
        category: pending.category,
        flows: [],
      };
      return ApiResponse.success(res, result);
    }

    const orders = await query(
      `SELECT o.*, ts.name as symbol_name, ts.price_decimals, ts.category, ts.contract_unit
       FROM trade_orders o
       JOIN trading_symbols ts ON o.symbol = ts.symbol
       WHERE o.id = ? AND o.user_id = ?`,
      [requestId, req.user.id]
    );
    if (orders.length === 0) return ApiResponse.notFound(res, '订单不存在');

    const order = orders[0];
    order.record_type = 'order';
    if (order.status === 'open') {
      const tick = marketData.getPrice(order.symbol) || {};
      order.currentPrice = order.direction === 'buy' ? tick.bid : tick.ask;
    }

    const flows = await query(
      'SELECT * FROM trade_flows WHERE order_id = ? ORDER BY created_at ASC',
      [order.id]
    );
    order.flows = flows;

    ApiResponse.success(res, order);
  } catch (err) {
    ApiResponse.error(res, '获取订单详情失败');
  }
});

router.get('/pendings', async (req, res) => {
  try {
    const { accountType = 'demo', status = 'active' } = req.query;
    const pendings = await query(
      `SELECT po.*, ts.name as symbol_name, ts.price_decimals, ts.category
       FROM pending_orders po
       JOIN trading_symbols ts ON po.symbol = ts.symbol
       WHERE po.user_id = ? AND po.account_type = ? AND po.status = ?
       ORDER BY po.created_at DESC`,
      [req.user.id, accountType, status]
    );

    const result = pendings.map(p => {
      const tick = marketData.getPrice(p.symbol) || {};
      return { ...p, currentBid: tick.bid || 0, currentAsk: tick.ask || 0 };
    });
    ApiResponse.success(res, result);
  } catch (err) {
    ApiResponse.error(res, '获取挂单列表失败');
  }
});

router.get('/account', async (req, res) => {
  try {
    const { accountType = 'demo' } = req.query;
    const overview = await accountService.getAccountOverview(req.user.id, accountType);

    const positionCount = await query(
      "SELECT COUNT(*) as cnt FROM trade_orders WHERE user_id = ? AND account_type = ? AND status = 'open'",
      [req.user.id, accountType]
    );

    ApiResponse.success(res, {
      ...overview,
      openPositions: positionCount[0].cnt,
    });
  } catch (err) {
    ApiResponse.error(res, '获取账户概览失败');
  }
});

router.post('/estimate', [
  body('symbolId').isInt({ min: 1 }).withMessage('品种ID无效'),
  body('direction').isIn(['buy', 'sell']).withMessage('方向无效'),
  body('lots').isFloat({ min: 0.01 }).withMessage('手数无效'),
  body('leverage').isInt({ min: 1 }).withMessage('杠杆无效'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return ApiResponse.badRequest(res, errors.array()[0].msg);

  try {
    const { symbolId, direction, lots, leverage } = req.body;
    const symbolRows = await query('SELECT * FROM trading_symbols WHERE id = ? AND status = ?', [symbolId, 'active']);
    if (symbolRows.length === 0) return ApiResponse.badRequest(res, '品种不存在');
    const symbolInfo = symbolRows[0];

    const price = marketData.getPrice(symbolInfo.symbol);
    if (!price) return ApiResponse.badRequest(res, '行情不可用');

    const openPrice = direction === 'buy' ? price.ask : price.bid;
    const fees = feeCalc.estimateOrderFees(symbolInfo, parseFloat(lots), openPrice, parseInt(leverage), direction);

    ApiResponse.success(res, {
      symbol: symbolInfo.symbol,
      price: openPrice,
      direction,
      lots: parseFloat(lots),
      leverage: parseInt(leverage),
      ...fees,
    });
  } catch (err) {
    ApiResponse.error(res, '费用预估失败');
  }
});

module.exports = router;
