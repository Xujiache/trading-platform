const express = require('express');
const router = express.Router();
const { param, validationResult } = require('express-validator');
const { authenticateAdmin } = require('../../middleware/auth');
const { auditLog } = require('../../middleware/auditLog');
const ApiResponse = require('../../utils/response');
const { query } = require('../../config/database');
const tradeEngine = require('../../services/tradeEngine');
const marketData = require('../../services/marketDataService');

router.use(authenticateAdmin);

router.get('/trade/orders', async (req, res) => {
  try {
    const { userId, symbol, status, direction, accountType, startDate, endDate, page = 1, pageSize = 20 } = req.query;
    const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(pageSize);
    const conditions = [];
    const params = [];

    if (userId) { conditions.push('o.user_id = ?'); params.push(userId); }
    if (symbol) { conditions.push('o.symbol = ?'); params.push(symbol); }
    if (status) { conditions.push('o.status = ?'); params.push(status); }
    if (direction) { conditions.push('o.direction = ?'); params.push(direction); }
    if (accountType) { conditions.push('o.account_type = ?'); params.push(accountType); }
    if (startDate) { conditions.push('o.created_at >= ?'); params.push(startDate); }
    if (endDate) { conditions.push('o.created_at <= ?'); params.push(endDate + ' 23:59:59'); }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query(`SELECT COUNT(*) as total FROM trade_orders o ${where}`, params);
    const total = countResult[0].total;

    const orders = await query(
      `SELECT o.*, ts.name as symbol_name, u.email as user_email, u.nickname as user_nickname
       FROM trade_orders o
       JOIN trading_symbols ts ON o.symbol = ts.symbol
       LEFT JOIN users u ON o.user_id = u.id
       ${where}
       ORDER BY o.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    );

    ApiResponse.paginate(res, { list: orders, total, page: parseInt(page), pageSize: parseInt(pageSize) });
  } catch (err) {
    ApiResponse.error(res, '获取订单列表失败');
  }
});

router.get('/trade/orders/:id', async (req, res) => {
  try {
    const orders = await query(
      `SELECT o.*, ts.name as symbol_name, ts.category, ts.contract_unit,
              u.email as user_email, u.nickname as user_nickname
       FROM trade_orders o
       JOIN trading_symbols ts ON o.symbol = ts.symbol
       LEFT JOIN users u ON o.user_id = u.id
       WHERE o.id = ?`,
      [req.params.id]
    );
    if (orders.length === 0) return ApiResponse.notFound(res, '订单不存在');

    const order = orders[0];
    const flows = await query('SELECT * FROM trade_flows WHERE order_id = ? ORDER BY created_at ASC', [order.id]);
    order.flows = flows;

    if (order.status === 'open') {
      const tick = marketData.getPrice(order.symbol) || {};
      order.currentPrice = order.direction === 'buy' ? tick.bid : tick.ask;
    }

    ApiResponse.success(res, order);
  } catch (err) {
    ApiResponse.error(res, '获取订单详情失败');
  }
});

router.get('/trade/positions', async (req, res) => {
  try {
    const { userId, symbol, accountType, page = 1, pageSize = 20 } = req.query;
    const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(pageSize);
    const conditions = ["o.status = 'open'"];
    const params = [];

    if (userId) { conditions.push('o.user_id = ?'); params.push(userId); }
    if (symbol) { conditions.push('o.symbol = ?'); params.push(symbol); }
    if (accountType) { conditions.push('o.account_type = ?'); params.push(accountType); }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const countResult = await query(`SELECT COUNT(*) as total FROM trade_orders o ${where}`, params);
    const total = countResult[0].total;

    const positions = await query(
      `SELECT o.*, ts.name as symbol_name, u.email as user_email, u.nickname as user_nickname
       FROM trade_orders o
       JOIN trading_symbols ts ON o.symbol = ts.symbol
       LEFT JOIN users u ON o.user_id = u.id
       ${where}
       ORDER BY o.opened_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    );

    const result = positions.map(p => {
      const tick = marketData.getPrice(p.symbol) || {};
      return { ...p, currentPrice: p.direction === 'buy' ? tick.bid : tick.ask };
    });

    ApiResponse.paginate(res, { list: result, total, page: parseInt(page), pageSize: parseInt(pageSize) });
  } catch (err) {
    ApiResponse.error(res, '获取持仓列表失败');
  }
});

router.get('/trade/pendings', async (req, res) => {
  try {
    const { userId, symbol, status = 'active', accountType, page = 1, pageSize = 20 } = req.query;
    const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(pageSize);
    const conditions = [];
    const params = [];

    if (status) { conditions.push('po.status = ?'); params.push(status); }
    if (userId) { conditions.push('po.user_id = ?'); params.push(userId); }
    if (symbol) { conditions.push('po.symbol = ?'); params.push(symbol); }
    if (accountType) { conditions.push('po.account_type = ?'); params.push(accountType); }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query(`SELECT COUNT(*) as total FROM pending_orders po ${where}`, params);
    const total = countResult[0].total;

    const pendings = await query(
      `SELECT po.*, ts.name as symbol_name, u.email as user_email, u.nickname as user_nickname
       FROM pending_orders po
       JOIN trading_symbols ts ON po.symbol = ts.symbol
       LEFT JOIN users u ON po.user_id = u.id
       ${where}
       ORDER BY po.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    );

    const result = pendings.map(p => {
      const tick = marketData.getPrice(p.symbol) || {};
      return { ...p, currentBid: tick.bid, currentAsk: tick.ask };
    });

    ApiResponse.paginate(res, { list: result, total, page: parseInt(page), pageSize: parseInt(pageSize) });
  } catch (err) {
    ApiResponse.error(res, '获取挂单列表失败');
  }
});

router.post('/trade/orders/:id/close', auditLog('交易管理', '管理员平仓', { targetType: 'order' }), async (req, res) => {
  try {
    const result = await tradeEngine.closePosition(null, parseInt(req.params.id), 'admin', req.admin.id);
    ApiResponse.success(res, result, '管理员平仓成功');
  } catch (err) {
    ApiResponse.badRequest(res, err.message);
  }
});

router.post('/trade/orders/:id/cancel', auditLog('交易管理', '管理员撤单', { targetType: 'order' }), async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const pending = await query("SELECT * FROM pending_orders WHERE id = ? AND status = 'active'", [orderId]);
    if (pending.length > 0) {
      await query("UPDATE pending_orders SET status = 'cancelled', comment = CONCAT(comment, ?) WHERE id = ?",
        [` [管理员${req.admin.id}撤销]`, orderId]);
      return ApiResponse.success(res, { id: orderId, status: 'cancelled' }, '挂单已撤销');
    }

    const order = await query("SELECT * FROM trade_orders WHERE id = ? AND status = 'open'", [orderId]);
    if (order.length > 0) {
      const result = await tradeEngine.closePosition(null, orderId, 'admin', req.admin.id);
      return ApiResponse.success(res, result, '订单已撤销(平仓处理)');
    }

    ApiResponse.notFound(res, '订单不存在或已完成');
  } catch (err) {
    ApiResponse.badRequest(res, err.message);
  }
});

router.put('/trade/orders/:id/price', auditLog('交易管理', '管理员改价', { targetType: 'order' }), async (req, res) => {
  try {
    const { newPrice } = req.body;
    if (!newPrice || isNaN(newPrice)) return ApiResponse.badRequest(res, '价格无效');

    const result = await tradeEngine.adminModifyPrice(parseInt(req.params.id), parseFloat(newPrice), req.admin.id);
    ApiResponse.success(res, result, '改价成功');
  } catch (err) {
    ApiResponse.badRequest(res, err.message);
  }
});

router.get('/trade/flows', async (req, res) => {
  try {
    const { userId, flowType, accountType, startDate, endDate, page = 1, pageSize = 20 } = req.query;
    const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(pageSize);
    const conditions = [];
    const params = [];

    if (userId) { conditions.push('f.user_id = ?'); params.push(userId); }
    if (flowType) { conditions.push('f.flow_type = ?'); params.push(flowType); }
    if (accountType) { conditions.push('f.account_type = ?'); params.push(accountType); }
    if (startDate) { conditions.push('f.created_at >= ?'); params.push(startDate); }
    if (endDate) { conditions.push('f.created_at <= ?'); params.push(endDate + ' 23:59:59'); }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query(`SELECT COUNT(*) as total FROM trade_flows f ${where}`, params);
    const total = countResult[0].total;

    const flows = await query(
      `SELECT f.*, u.email as user_email, u.nickname as user_nickname
       FROM trade_flows f
       LEFT JOIN users u ON f.user_id = u.id
       ${where}
       ORDER BY f.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    );

    ApiResponse.paginate(res, { list: flows, total, page: parseInt(page), pageSize: parseInt(pageSize) });
  } catch (err) {
    ApiResponse.error(res, '获取交易流水失败');
  }
});

router.get('/trade/statistics', async (req, res) => {
  try {
    const { startDate, endDate, accountType } = req.query;
    const conditions = [];
    const params = [];
    if (startDate) { conditions.push('created_at >= ?'); params.push(startDate); }
    if (endDate) { conditions.push('created_at <= ?'); params.push(endDate + ' 23:59:59'); }
    if (accountType) { conditions.push('account_type = ?'); params.push(accountType); }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [totalStats] = await query(
      `SELECT
        COUNT(*) as total_orders,
        SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_orders,
        SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed_orders,
        SUM(CASE WHEN status = 'closed' THEN COALESCE(realized_pnl, 0) ELSE 0 END) as total_pnl,
        SUM(CASE WHEN status = 'closed' THEN COALESCE(net_pnl, 0) ELSE 0 END) as total_net_pnl,
        SUM(COALESCE(commission, 0) + COALESCE(commission_close, 0)) as total_commission,
        SUM(COALESCE(swap_total, 0)) as total_swap,
        SUM(COALESCE(margin, 0) * CASE WHEN status = 'open' THEN 1 ELSE 0 END) as total_frozen_margin
       FROM trade_orders ${where}`,
      params
    );

    const symbolStats = await query(
      `SELECT symbol,
        COUNT(*) as order_count,
        SUM(CASE WHEN status = 'closed' THEN COALESCE(realized_pnl, 0) ELSE 0 END) as pnl,
        SUM(lots) as total_lots
       FROM trade_orders ${where}
       GROUP BY symbol ORDER BY order_count DESC`,
      params
    );

    ApiResponse.success(res, { overview: totalStats, bySymbol: symbolStats });
  } catch (err) {
    ApiResponse.error(res, '获取交易统计失败');
  }
});

router.get('/trade/stats', async (req, res) => {
  try {
    const [stats] = await query(
      `SELECT
        COUNT(*) as total_orders,
        SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_count,
        SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed_count
       FROM trade_orders`
    );
    ApiResponse.success(res, stats);
  } catch (err) {
    ApiResponse.error(res, '获取统计失败');
  }
});

module.exports = router;
