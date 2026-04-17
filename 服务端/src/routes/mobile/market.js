const express = require('express');
const router = express.Router();
const { query } = require('../../config/database');
const ApiResponse = require('../../utils/response');
const { authenticateToken } = require('../../middleware/auth');
const { body, validationResult } = require('express-validator');
const marketData = require('../../services/marketDataService');
const { getKlineData, getCurrentKline, PERIODS } = require('../../services/klineService');
const { getMonitorStatus } = require('../../services/marketMonitorService');

router.get('/symbols', async (req, res) => {
  try {
    const { category, keyword } = req.query;
    let symbols = marketData.getAllSymbolInfos();
    if (category && category !== 'all') symbols = symbols.filter(s => s.category === category);
    if (keyword) {
      const kw = keyword.toLowerCase();
      symbols = symbols.filter(s => s.symbol.toLowerCase().includes(kw) || s.name.toLowerCase().includes(kw));
    }
    const result = symbols.map(s => {
      const tick = marketData.getPrice(s.symbol) || {};
      return {
        id: s.id, symbol: s.symbol, name: s.name, category: s.category, is_hot: !!s.is_hot,
        price_decimals: s.price_decimals, bid: tick.bid || 0, ask: tick.ask || 0,
        high: tick.high || 0, low: tick.low || 0, open: tick.open || 0,
        change: tick.change || 0, change_percent: tick.change_percent || 0, volume: tick.volume || 0,
      };
    });
    ApiResponse.success(res, result);
  } catch (err) {
    ApiResponse.error(res, '获取品种列表失败');
  }
});

router.get('/symbols/:id', async (req, res) => {
  try {
    const rows = await query('SELECT * FROM trading_symbols WHERE id = ? AND status = ?', [req.params.id, 'active']);
    if (rows.length === 0) return ApiResponse.notFound(res, '品种不存在');
    const sym = rows[0];
    const tick = marketData.getPrice(sym.symbol) || {};
    let tradingHours = sym.trading_hours;
    if (typeof tradingHours === 'string') { try { tradingHours = JSON.parse(tradingHours); } catch {} }

    ApiResponse.success(res, {
      ...sym, trading_hours: tradingHours,
      bid: tick.bid || 0, ask: tick.ask || 0, high: tick.high || 0, low: tick.low || 0,
      open: tick.open || 0, prev_close: tick.prev_close || 0,
      change: tick.change || 0, change_percent: tick.change_percent || 0, volume: tick.volume || 0,
    });
  } catch (err) {
    ApiResponse.error(res, '获取品种详情失败');
  }
});

router.get('/kline', async (req, res) => {
  try {
    const { symbol, period = '1m', limit = 200, start_time, end_time } = req.query;
    if (!symbol) return ApiResponse.badRequest(res, '缺少品种代码');
    if (!PERIODS.includes(period)) return ApiResponse.badRequest(res, '无效的K线周期');
    const data = await getKlineData(symbol, period, parseInt(limit), start_time, end_time);
    const current = getCurrentKline(symbol, period);
    if (current) data.push(current);
    ApiResponse.success(res, {
      symbol, period, count: data.length,
      klines: data.map(k => ({
        time: k.open_time,
        open: +parseFloat(k.open_price).toFixed(6),
        high: +parseFloat(k.high_price).toFixed(6),
        low: +parseFloat(k.low_price).toFixed(6),
        close: +parseFloat(k.close_price).toFixed(6),
        volume: Math.round(parseFloat(k.volume || 0)),
      })),
    });
  } catch (err) {
    ApiResponse.error(res, '获取K线数据失败');
  }
});

router.get('/status', (req, res) => {
  const monitor = getMonitorStatus();
  ApiResponse.success(res, {
    isOpen: true, lastUpdate: monitor.lastUpdateTime,
    isHealthy: monitor.isHealthy, activeSymbols: marketData.getAllSymbolInfos().length,
  });
});

router.get('/categories', (req, res) => {
  ApiResponse.success(res, [
    { key: 'all', label: '全部' }, { key: 'precious_metal', label: '贵金属' },
    { key: 'energy', label: '能源' }, { key: 'forex', label: '外汇' },
  ]);
});

router.get('/alerts', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, pageSize = 20 } = req.query;
    const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(pageSize);
    const conditions = ['pa.user_id = ?'];
    const params = [userId];
    if (status && ['active', 'triggered', 'disabled'].includes(status)) { conditions.push('pa.status = ?'); params.push(status); }
    const where = `WHERE ${conditions.join(' AND ')}`;
    const countResult = await query(`SELECT COUNT(*) as total FROM price_alerts pa ${where}`, params);
    const total = countResult[0].total;
    const items = await query(`SELECT pa.*, ts.name as symbol_name, ts.category FROM price_alerts pa LEFT JOIN trading_symbols ts ON pa.symbol = ts.symbol ${where} ORDER BY pa.created_at DESC LIMIT ? OFFSET ?`, [...params, parseInt(pageSize), offset]);
    ApiResponse.paginate(res, { list: items, total, page: parseInt(page), pageSize: parseInt(pageSize) });
  } catch (err) {
    ApiResponse.error(res, '获取预警列表失败');
  }
});

router.post('/alerts', authenticateToken, [
  body('symbol').trim().notEmpty().withMessage('品种代码不能为空'),
  body('alert_type').isIn(['price_above', 'price_below', 'change_percent']).withMessage('无效预警类型'),
  body('target_value').isFloat().withMessage('目标值无效'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return ApiResponse.badRequest(res, '参数验证失败', errors.array());
  try {
    const { symbol, alert_type, target_value, notify_method = 'push', note } = req.body;
    const userId = req.user.id;
    const symCheck = await query('SELECT id FROM trading_symbols WHERE symbol = ? AND status = ?', [symbol, 'active']);
    if (symCheck.length === 0) return ApiResponse.badRequest(res, '品种不存在或已禁用');
    const result = await query('INSERT INTO price_alerts (user_id,symbol,alert_type,target_value,notify_method,note) VALUES (?,?,?,?,?,?)', [userId, symbol, alert_type, target_value, notify_method, note || null]);
    const newAlert = await query('SELECT * FROM price_alerts WHERE id = ?', [result.insertId]);
    ApiResponse.created(res, newAlert[0], '预警创建成功');
  } catch (err) {
    ApiResponse.error(res, '创建预警失败');
  }
});

router.put('/alerts/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const existing = await query('SELECT * FROM price_alerts WHERE id = ? AND user_id = ?', [req.params.id, userId]);
    if (existing.length === 0) return ApiResponse.notFound(res, '预警不存在');
    const { alert_type, target_value, notify_method, note, status: alertStatus } = req.body;
    const updates = [], params = [];
    if (alert_type) { updates.push('alert_type = ?'); params.push(alert_type); }
    if (target_value !== undefined) { updates.push('target_value = ?'); params.push(target_value); }
    if (notify_method) { updates.push('notify_method = ?'); params.push(notify_method); }
    if (note !== undefined) { updates.push('note = ?'); params.push(note); }
    if (alertStatus) { updates.push('status = ?'); params.push(alertStatus); }
    if (updates.length === 0) return ApiResponse.badRequest(res, '没有可更新的字段');
    params.push(req.params.id, userId);
    await query(`UPDATE price_alerts SET ${updates.join(',')} WHERE id = ? AND user_id = ?`, params);
    const updated = await query('SELECT * FROM price_alerts WHERE id = ?', [req.params.id]);
    ApiResponse.success(res, updated[0], '预警更新成功');
  } catch (err) {
    ApiResponse.error(res, '更新预警失败');
  }
});

router.delete('/alerts/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const existing = await query('SELECT * FROM price_alerts WHERE id = ? AND user_id = ?', [req.params.id, userId]);
    if (existing.length === 0) return ApiResponse.notFound(res, '预警不存在');
    await query('DELETE FROM price_alerts WHERE id = ? AND user_id = ?', [req.params.id, userId]);
    ApiResponse.success(res, null, '预警删除成功');
  } catch (err) {
    ApiResponse.error(res, '删除预警失败');
  }
});

module.exports = router;
