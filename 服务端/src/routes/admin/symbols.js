const express = require('express');
const router = express.Router();
const { query, pool } = require('../../config/database');
const ApiResponse = require('../../utils/response');
const { authenticateAdmin } = require('../../middleware/auth');
const { auditLog } = require('../../middleware/auditLog');
const { body, validationResult } = require('express-validator');
const marketData = require('../../services/marketDataService');
const customPriceEngine = require('../../services/customPriceEngine');
const { generateKlineForSymbol } = require('../../scripts/generateKlineData');

const VALID_CATEGORIES = ['precious_metal', 'energy', 'forex'];
const VALID_PRICE_SOURCE = ['real', 'custom', 'hybrid'];
const VALID_TREND = ['up', 'down', 'sideways'];
const VALID_VOLATILITY = ['low', 'medium', 'high', 'custom'];

const validateSymbol = [
  body('symbol').trim().notEmpty().withMessage('品种代码不能为空').isLength({ max: 20 }),
  body('name').trim().notEmpty().withMessage('品种名称不能为空').isLength({ max: 100 }),
  body('category').isIn(VALID_CATEGORIES).withMessage('无效的品种分类'),
];

function checkValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return ApiResponse.badRequest(res, '参数验证失败', errors.array());
  }
  return null;
}

// ==================== 模拟引擎实时状态 (优先匹配, 避开 :id 模式) ====================

/** 引擎实时状态快照, 监控页用 */
router.get('/symbols/sim/status', authenticateAdmin, async (req, res) => {
  try {
    const list = customPriceEngine.getSimStatus();
    ApiResponse.success(res, { list, total: list.length });
  } catch (err) {
    ApiResponse.error(res, '获取引擎状态失败');
  }
});

// ==================== 基础 CRUD ====================

router.get('/symbols', authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, category, status, price_source, keyword, sort_by = 'sort_order', sort_order = 'ASC' } = req.query;
    const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(pageSize);
    const conditions = [];
    const params = [];

    if (category && VALID_CATEGORIES.includes(category)) { conditions.push('category = ?'); params.push(category); }
    if (status && ['active', 'inactive'].includes(status)) { conditions.push('status = ?'); params.push(status); }
    if (price_source && VALID_PRICE_SOURCE.includes(price_source)) { conditions.push('price_source = ?'); params.push(price_source); }
    if (keyword) { conditions.push('(symbol LIKE ? OR name LIKE ?)'); params.push(`%${keyword}%`, `%${keyword}%`); }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const allowed = ['sort_order', 'symbol', 'name', 'category', 'created_at'];
    const sortField = allowed.includes(sort_by) ? sort_by : 'sort_order';
    const sortDir = sort_order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const countResult = await query(`SELECT COUNT(*) as total FROM trading_symbols ${where}`, params);
    const total = countResult[0].total;
    const items = await query(`SELECT * FROM trading_symbols ${where} ORDER BY ${sortField} ${sortDir} LIMIT ? OFFSET ?`, [...params, parseInt(pageSize), offset]);

    ApiResponse.paginate(res, { list: items, total, page: parseInt(page), pageSize: parseInt(pageSize) });
  } catch (err) {
    ApiResponse.error(res, '获取品种列表失败');
  }
});

router.post('/symbols', authenticateAdmin, validateSymbol, auditLog('行情模拟', '新增品种'), async (req, res) => {
  if (checkValidation(req, res)) return;
  try {
    const existing = await query('SELECT id FROM trading_symbols WHERE symbol = ?', [req.body.symbol]);
    if (existing.length > 0) return ApiResponse.badRequest(res, '品种代码已存在');

    const fields = ['symbol','name','category','price_source','is_hot','contract_unit','min_lot','max_lot','lot_step','min_leverage','max_leverage','price_decimals','tick_value','tick_size','spread_mode','spread_fixed','spread_min','spread_max','fee_mode','fee_type','fee_value','swap_long_rate','swap_short_rate','swap_wednesday_multiplier','swap_holiday_multiplier','max_position','max_slippage','trading_hours','sort_order','description'];
    const insertFields = [], insertValues = [];
    for (const f of fields) {
      if (req.body[f] !== undefined) {
        insertFields.push(f);
        insertValues.push(f === 'trading_hours' && typeof req.body[f] === 'object' ? JSON.stringify(req.body[f]) : req.body[f]);
      }
    }

    const sql = `INSERT INTO trading_symbols (${insertFields.join(',')}) VALUES (${insertFields.map(() => '?').join(',')})`;
    const result = await query(sql, insertValues);
    const newRow = await query('SELECT * FROM trading_symbols WHERE id = ?', [result.insertId]);
    await marketData.refreshSymbol(result.insertId);
    ApiResponse.created(res, newRow[0], '品种创建成功');
  } catch (err) {
    ApiResponse.error(res, '创建品种失败');
  }
});

router.get('/symbols/:id', authenticateAdmin, async (req, res) => {
  try {
    const rows = await query('SELECT * FROM trading_symbols WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return ApiResponse.notFound(res, '品种不存在');
    ApiResponse.success(res, rows[0]);
  } catch (err) {
    ApiResponse.error(res, '获取品种详情失败');
  }
});

router.put('/symbols/:id', authenticateAdmin, validateSymbol, auditLog('行情模拟', '更新品种'), async (req, res) => {
  if (checkValidation(req, res)) return;
  try {
    const existing = await query('SELECT id FROM trading_symbols WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return ApiResponse.notFound(res, '品种不存在');

    const dup = await query('SELECT id FROM trading_symbols WHERE symbol = ? AND id != ?', [req.body.symbol, req.params.id]);
    if (dup.length > 0) return ApiResponse.badRequest(res, '品种代码已被占用');

    const fields = ['symbol','name','category','price_source','is_hot','contract_unit','min_lot','max_lot','lot_step','min_leverage','max_leverage','price_decimals','tick_value','tick_size','spread_mode','spread_fixed','spread_min','spread_max','fee_mode','fee_type','fee_value','swap_long_rate','swap_short_rate','swap_wednesday_multiplier','swap_holiday_multiplier','max_position','max_slippage','trading_hours','sort_order','description'];
    const sets = [], vals = [];
    for (const f of fields) {
      if (req.body[f] !== undefined) {
        sets.push(`${f} = ?`);
        vals.push(f === 'trading_hours' && typeof req.body[f] === 'object' ? JSON.stringify(req.body[f]) : req.body[f]);
      }
    }
    if (sets.length === 0) return ApiResponse.badRequest(res, '没有可更新的字段');

    vals.push(req.params.id);
    await query(`UPDATE trading_symbols SET ${sets.join(',')} WHERE id = ?`, vals);
    const updated = await query('SELECT * FROM trading_symbols WHERE id = ?', [req.params.id]);
    await marketData.refreshSymbol(parseInt(req.params.id));
    try { await customPriceEngine.reloadConfig(parseInt(req.params.id)); } catch (_) { /* ignore */ }
    ApiResponse.success(res, updated[0], '品种更新成功');
  } catch (err) {
    ApiResponse.error(res, '更新品种失败');
  }
});

router.put('/symbols/:id/status', authenticateAdmin, [
  body('status').isIn(['active', 'inactive']).withMessage('状态值无效')
], auditLog('行情模拟', '品种上下架'), async (req, res) => {
  if (checkValidation(req, res)) return;
  try {
    const existing = await query('SELECT id FROM trading_symbols WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return ApiResponse.notFound(res, '品种不存在');
    await query('UPDATE trading_symbols SET status = ? WHERE id = ?', [req.body.status, req.params.id]);
    const updated = await query('SELECT * FROM trading_symbols WHERE id = ?', [req.params.id]);
    await marketData.refreshSymbol(parseInt(req.params.id));
    try { await customPriceEngine.reloadConfig(parseInt(req.params.id)); } catch (_) { /* ignore */ }
    ApiResponse.success(res, updated[0], `品种${req.body.status === 'active' ? '启用' : '禁用'}成功`);
  } catch (err) {
    ApiResponse.error(res, '更新品种状态失败');
  }
});

router.delete('/symbols/:id', authenticateAdmin, auditLog('行情模拟', '删除品种'), async (req, res) => {
  try {
    const existing = await query('SELECT id, symbol FROM trading_symbols WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return ApiResponse.notFound(res, '品种不存在');

    const hasKline = await query('SELECT id FROM kline_data WHERE symbol = ? LIMIT 1', [existing[0].symbol]);
    const hasAlerts = await query('SELECT id FROM price_alerts WHERE symbol = ? AND status = ? LIMIT 1', [existing[0].symbol, 'active']);

    if (hasKline.length > 0 || hasAlerts.length > 0) {
      await query('UPDATE trading_symbols SET status = ? WHERE id = ?', ['inactive', req.params.id]);
      const updated = await query('SELECT * FROM trading_symbols WHERE id = ?', [req.params.id]);
      await marketData.refreshSymbol(parseInt(req.params.id));
      try { await customPriceEngine.reloadConfig(parseInt(req.params.id)); } catch (_) { /* ignore */ }
      return ApiResponse.success(res, updated[0], '品种有关联数据，已自动禁用');
    }

    await query('DELETE FROM symbol_sim_configs WHERE symbol_id = ?', [req.params.id]);
    await query('DELETE FROM trading_symbols WHERE id = ?', [req.params.id]);
    customPriceEngine.removeSymbol(existing[0].symbol);
    ApiResponse.success(res, null, '品种删除成功');
  } catch (err) {
    ApiResponse.error(res, '删除品种失败');
  }
});

// ==================== 模拟引擎配置与控制 ====================

router.get('/symbols/:id/sim-config', authenticateAdmin, async (req, res) => {
  try {
    const rows = await query(
      `SELECT s.symbol, s.name, s.price_source, c.* FROM trading_symbols s
       LEFT JOIN symbol_sim_configs c ON c.symbol_id = s.id
       WHERE s.id = ? LIMIT 1`,
      [req.params.id]
    );
    if (rows.length === 0) return ApiResponse.notFound(res, '品种不存在');
    const row = rows[0];
    const data = {
      symbol_id: parseInt(req.params.id),
      symbol: row.symbol,
      name: row.name,
      price_source: row.price_source,
      config: row.symbol_id ? {
        center_price: row.center_price,
        lower_bound: row.lower_bound,
        upper_bound: row.upper_bound,
        trend_direction: row.trend_direction,
        trend_strength: row.trend_strength,
        volatility_level: row.volatility_level,
        volatility_sigma: row.volatility_sigma,
        mean_reversion_kappa: row.mean_reversion_kappa,
        tick_interval_ms: row.tick_interval_ms,
        max_tick_change_pct: row.max_tick_change_pct,
        hybrid_bias: row.hybrid_bias,
        last_price: row.last_price,
        enabled: row.enabled,
        updated_at: row.updated_at,
      } : null,
      runtime: customPriceEngine.getSimStatus().find((s) => s.symbol === row.symbol) || null,
    };
    ApiResponse.success(res, data);
  } catch (err) {
    ApiResponse.error(res, '获取模拟配置失败');
  }
});

router.put('/symbols/:id/sim-config', authenticateAdmin, auditLog('行情模拟', '更新模拟配置'), async (req, res) => {
  try {
    const symbolId = parseInt(req.params.id);
    const symRows = await query('SELECT id, symbol FROM trading_symbols WHERE id = ?', [symbolId]);
    if (symRows.length === 0) return ApiResponse.notFound(res, '品种不存在');
    const symbol = symRows[0].symbol;

    const b = req.body || {};
    const centerPrice = parseFloat(b.center_price);
    const lowerBound = parseFloat(b.lower_bound);
    const upperBound = parseFloat(b.upper_bound);
    if (!Number.isFinite(centerPrice) || !Number.isFinite(lowerBound) || !Number.isFinite(upperBound)) {
      return ApiResponse.badRequest(res, '中枢价 / 上下限必须是数字');
    }
    if (lowerBound >= upperBound) return ApiResponse.badRequest(res, '下限必须小于上限');
    if (centerPrice < lowerBound || centerPrice > upperBound) {
      return ApiResponse.badRequest(res, '中枢价必须在上下限区间内');
    }
    const rangePct = (upperBound - lowerBound) / centerPrice;
    if (rangePct < 0.005) {
      return ApiResponse.badRequest(res, '区间过窄(小于中枢价的0.5%), 易粘边');
    }

    const trendDirection = VALID_TREND.includes(b.trend_direction) ? b.trend_direction : 'sideways';
    const volatilityLevel = VALID_VOLATILITY.includes(b.volatility_level) ? b.volatility_level : 'medium';
    const trendStrength = b.trend_strength != null ? Math.max(0, Math.min(1, parseFloat(b.trend_strength))) : 0.5;
    const volatilitySigma = b.volatility_sigma != null && b.volatility_sigma !== '' ? parseFloat(b.volatility_sigma) : null;
    const kappa = b.mean_reversion_kappa != null && b.mean_reversion_kappa !== '' ? parseFloat(b.mean_reversion_kappa) : null;
    const tickIntervalMs = Math.max(
      customPriceEngine.MIN_TICK_INTERVAL_MS,
      Math.min(customPriceEngine.MAX_TICK_INTERVAL_MS, parseInt(b.tick_interval_ms) || 1000)
    );
    const maxTickChangePct = b.max_tick_change_pct != null && b.max_tick_change_pct !== ''
      ? Math.max(0.0001, Math.min(0.05, parseFloat(b.max_tick_change_pct)))
      : 0.0015;
    const hybridBias = b.hybrid_bias != null && b.hybrid_bias !== '' ? parseFloat(b.hybrid_bias) : 0;
    const enabled = b.enabled === undefined ? 1 : (b.enabled ? 1 : 0);
    const adminId = req.admin?.id || null;

    await query(
      `INSERT INTO symbol_sim_configs
        (symbol_id, symbol, center_price, lower_bound, upper_bound, trend_direction, trend_strength,
         volatility_level, volatility_sigma, mean_reversion_kappa, tick_interval_ms, max_tick_change_pct,
         hybrid_bias, enabled, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         center_price = VALUES(center_price),
         lower_bound = VALUES(lower_bound),
         upper_bound = VALUES(upper_bound),
         trend_direction = VALUES(trend_direction),
         trend_strength = VALUES(trend_strength),
         volatility_level = VALUES(volatility_level),
         volatility_sigma = VALUES(volatility_sigma),
         mean_reversion_kappa = VALUES(mean_reversion_kappa),
         tick_interval_ms = VALUES(tick_interval_ms),
         max_tick_change_pct = VALUES(max_tick_change_pct),
         hybrid_bias = VALUES(hybrid_bias),
         enabled = VALUES(enabled),
         updated_by = VALUES(updated_by)`,
      [symbolId, symbol, centerPrice, lowerBound, upperBound, trendDirection, trendStrength,
       volatilityLevel, volatilitySigma, kappa, tickIntervalMs, maxTickChangePct,
       hybridBias, enabled, adminId]
    );

    const reloadResult = await customPriceEngine.reloadConfig(symbolId);
    ApiResponse.success(res, { symbolId, symbol, reload: reloadResult }, '模拟配置已更新并热加载');
  } catch (err) {
    ApiResponse.badRequest(res, err.message || '更新模拟配置失败');
  }
});

router.put('/symbols/:id/price-source', authenticateAdmin, [
  body('price_source').isIn(VALID_PRICE_SOURCE).withMessage('price_source 无效')
], auditLog('行情模拟', '切换行情源'), async (req, res) => {
  if (checkValidation(req, res)) return;
  try {
    const symbolId = parseInt(req.params.id);
    const rows = await query('SELECT id, symbol, price_source FROM trading_symbols WHERE id = ?', [symbolId]);
    if (rows.length === 0) return ApiResponse.notFound(res, '品种不存在');

    const newSource = req.body.price_source;
    const symbol = rows[0].symbol;

    if (newSource !== 'real') {
      const cfg = await query('SELECT id FROM symbol_sim_configs WHERE symbol_id = ? LIMIT 1', [symbolId]);
      if (cfg.length === 0) {
        return ApiResponse.badRequest(res, '切到 custom/hybrid 前必须先保存模拟配置');
      }
    }

    await query('UPDATE trading_symbols SET price_source = ? WHERE id = ?', [newSource, symbolId]);
    await marketData.refreshSymbol(symbolId);
    const reload = await customPriceEngine.reloadConfig(symbolId);

    ApiResponse.success(res, { symbolId, symbol, price_source: newSource, reload }, '行情源切换成功');
  } catch (err) {
    ApiResponse.badRequest(res, err.message || '切换行情源失败');
  }
});

router.post('/symbols/:id/sim-reset-center', authenticateAdmin, auditLog('行情模拟', '重置中枢'), async (req, res) => {
  try {
    const symbolId = parseInt(req.params.id);
    const rows = await query('SELECT symbol FROM trading_symbols WHERE id = ?', [symbolId]);
    if (rows.length === 0) return ApiResponse.notFound(res, '品种不存在');
    const price = await customPriceEngine.resetCenter(rows[0].symbol);
    ApiResponse.success(res, { symbol: rows[0].symbol, center_price: price }, '中枢已重置为当前价');
  } catch (err) {
    ApiResponse.badRequest(res, err.message || '重置中枢失败');
  }
});

router.post('/symbols/:id/sim-nudge', authenticateAdmin, auditLog('行情模拟', '手动推价'), async (req, res) => {
  try {
    const symbolId = parseInt(req.params.id);
    const rows = await query('SELECT symbol FROM trading_symbols WHERE id = ?', [symbolId]);
    if (rows.length === 0) return ApiResponse.notFound(res, '品种不存在');
    const symbol = rows[0].symbol;

    let newPrice;
    if (req.body.price != null) {
      newPrice = customPriceEngine.setPrice(symbol, req.body.price);
    } else if (req.body.delta != null) {
      newPrice = customPriceEngine.nudgePrice(symbol, req.body.delta);
    } else {
      return ApiResponse.badRequest(res, '必须提供 price 或 delta');
    }
    ApiResponse.success(res, { symbol, price: newPrice }, '推价成功');
  } catch (err) {
    ApiResponse.badRequest(res, err.message || '推价失败');
  }
});

router.post('/symbols/:id/sim-rebuild-kline', authenticateAdmin, auditLog('行情模拟', '重建K线'), async (req, res) => {
  try {
    const symbolId = parseInt(req.params.id);
    const rows = await query(
      `SELECT s.symbol, s.price_decimals, c.center_price, c.lower_bound, c.upper_bound,
              c.volatility_level, c.volatility_sigma, c.trend_direction, c.trend_strength
       FROM trading_symbols s
       LEFT JOIN symbol_sim_configs c ON c.symbol_id = s.id
       WHERE s.id = ? LIMIT 1`,
      [symbolId]
    );
    if (rows.length === 0) return ApiResponse.notFound(res, '品种不存在');
    const row = rows[0];
    if (!row.center_price) {
      return ApiResponse.badRequest(res, '需先配置模拟参数再重建 K 线');
    }

    const sigmaMap = { low: 0.004, medium: 0.008, high: 0.014 };
    const volCandle = row.volatility_sigma != null
      ? parseFloat(row.volatility_sigma) * 10
      : (sigmaMap[row.volatility_level] || sigmaMap.medium);
    const signMap = { up: 1, down: -1, sideways: 0 };
    const trendBias = (signMap[row.trend_direction] || 0) * parseFloat(row.trend_strength || 0) * 0.0005;

    const conn = await pool.getConnection();
    let inserted = 0;
    try {
      inserted = await generateKlineForSymbol(conn, row.symbol, {
        basePrice: parseFloat(row.center_price),
        decimals: Number(row.price_decimals) || 2,
        volatility: volCandle,
        trendBias,
        lowerBound: parseFloat(row.lower_bound),
        upperBound: parseFloat(row.upper_bound),
        truncate: true,
      });
    } finally {
      conn.release();
    }

    ApiResponse.success(res, { symbol: row.symbol, inserted }, `K线重建完成, 共 ${inserted} 条`);
  } catch (err) {
    ApiResponse.error(res, err.message || 'K线重建失败');
  }
});

module.exports = router;
