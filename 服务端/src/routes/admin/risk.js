const router = require('express').Router();
const { authenticateAdmin } = require('../../middleware/auth');
const { auditLog } = require('../../middleware/auditLog');
const ApiResponse = require('../../utils/response');
const { query } = require('../../config/database');
const tradeEngine = require('../../services/tradeEngine');

router.use(authenticateAdmin);

/** 获取风控参数配置 */
router.get('/risk/config', async (req, res) => {
  try {
    const configs = await query(
      `SELECT config_key, config_value, config_type, label FROM system_config
       WHERE config_key = ? OR config_key = ? OR config_key = ? OR config_key = ?`,
      ['warning_line', 'force_close_line', 'max_position_per_symbol', 'max_leverage']
    );
    const result = {};
    configs.forEach(c => { result[c.config_key] = { value: c.config_value, type: c.config_type, label: c.label }; });
    ApiResponse.success(res, result);
  } catch (err) {
    ApiResponse.error(res, '获取风控参数失败');
  }
});

/** 更新风控参数 */
router.put('/risk/config', auditLog('风控管理', '更新风控参数'), async (req, res) => {
  try {
    const updates = req.body;
    for (const [key, value] of Object.entries(updates)) {
      await query(
        "UPDATE system_config SET config_value = ? WHERE config_key = ?",
        [String(value), key]
      );
    }
    ApiResponse.success(res, null, '更新成功');
  } catch (err) {
    ApiResponse.error(res, '更新失败');
  }
});

/** 风险预警列表 */
router.get('/risk/alerts', async (req, res) => {
  try {
    const { alertType, level, status, userId, page = 1, pageSize = 20 } = req.query;
    const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(pageSize);
    const conditions = [];
    const params = [];

    if (alertType) { conditions.push('ra.alert_type = ?'); params.push(alertType); }
    if (level) { conditions.push('ra.level = ?'); params.push(level); }
    if (status) { conditions.push('ra.status = ?'); params.push(status); }
    if (userId) { conditions.push('ra.user_id = ?'); params.push(userId); }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [{ total }] = await query(`SELECT COUNT(*) as total FROM risk_alerts ra ${where}`, params);

    const alerts = await query(
      `SELECT ra.*, u.email as user_email, u.nickname as user_nickname
       FROM risk_alerts ra
       LEFT JOIN users u ON ra.user_id = u.id
       ${where}
       ORDER BY ra.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    );

    ApiResponse.paginate(res, { list: alerts, total, page: parseInt(page), pageSize: parseInt(pageSize) });
  } catch (err) {
    ApiResponse.error(res, '获取预警列表失败');
  }
});

/** 处理风险预警 */
router.post('/risk/alerts/:id/process', auditLog('风控管理', '处理风险预警', { targetType: 'risk_alert' }), async (req, res) => {
  try {
    const { action, remark } = req.body;
    if (!['processed', 'ignored', 'closed'].includes(action)) {
      return ApiResponse.badRequest(res, '无效的处理操作');
    }

    const [alert] = await query('SELECT status FROM risk_alerts WHERE id = ?', [req.params.id]);
    if (!alert) return ApiResponse.notFound(res, '预警不存在');
    if (alert.status !== 'pending') return ApiResponse.badRequest(res, '该预警已处理');

    await query(
      `UPDATE risk_alerts SET status = ?, processed_by = ?, processed_at = NOW(), process_remark = ? WHERE id = ?`,
      [action, req.admin.id, remark || '', req.params.id]
    );

    ApiResponse.success(res, null, '处理成功');
  } catch (err) {
    ApiResponse.error(res, '处理失败');
  }
});

/** 强平记录列表 */
router.get('/risk/force-close', async (req, res) => {
  try {
    const { userId, triggerType, startDate, endDate, page = 1, pageSize = 20 } = req.query;
    const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(pageSize);
    const conditions = [];
    const params = [];

    if (userId) { conditions.push('fc.user_id = ?'); params.push(userId); }
    if (triggerType) { conditions.push('fc.trigger_type = ?'); params.push(triggerType); }
    if (startDate) { conditions.push('fc.created_at >= ?'); params.push(startDate); }
    if (endDate) { conditions.push('fc.created_at <= ?'); params.push(endDate + ' 23:59:59'); }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [{ total }] = await query(`SELECT COUNT(*) as total FROM force_close_records fc ${where}`, params);

    const records = await query(
      `SELECT fc.*, u.email as user_email, u.nickname as user_nickname,
              o.order_no, o.symbol, o.direction, o.lots
       FROM force_close_records fc
       LEFT JOIN users u ON fc.user_id = u.id
       LEFT JOIN trade_orders o ON fc.order_id = o.id
       ${where}
       ORDER BY fc.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    );

    ApiResponse.paginate(res, { list: records, total, page: parseInt(page), pageSize: parseInt(pageSize) });
  } catch (err) {
    ApiResponse.error(res, '获取强平记录失败');
  }
});

/** 手动强平指定用户所有持仓 */
router.post('/risk/force-close/:userId', auditLog('风控管理', '手动强平', { targetType: 'user', getTargetId: (req) => req.params.userId }), async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const openOrders = await query(
      "SELECT id FROM trade_orders WHERE user_id = ? AND status = 'open'", [userId]
    );

    if (openOrders.length === 0) return ApiResponse.badRequest(res, '该用户无持仓');

    const [account] = await query(
      'SELECT balance, frozen_margin, floating_pnl FROM fund_accounts WHERE user_id = ? AND account_type = (SELECT account_type FROM users WHERE id = ?)',
      [userId, userId]
    );
    const equity = account ? parseFloat(account.balance) + parseFloat(account.floating_pnl) : 0;
    const marginRatio = account && parseFloat(account.frozen_margin) > 0
      ? (equity / parseFloat(account.frozen_margin) * 100) : 100;

    const results = [];
    for (const order of openOrders) {
      try {
        const result = await tradeEngine.closePosition(null, order.id, 'force_close', req.admin.id);
        await query(
          `INSERT INTO force_close_records (user_id, order_id, trigger_type, trigger_reason, margin_ratio, close_price, realized_pnl, admin_id)
           VALUES (?, ?, 'manual', '管理员手动强平', ?, ?, ?, ?)`,
          [userId, order.id, marginRatio.toFixed(4), result?.close_price || 0, result?.realized_pnl || 0, req.admin.id]
        );
        results.push({ orderId: order.id, success: true, data: result });
      } catch (e) {
        results.push({ orderId: order.id, success: false, error: e.message });
      }
    }

    ApiResponse.success(res, { total: openOrders.length, results }, '强平操作完成');
  } catch (err) {
    ApiResponse.error(res, '强平操作失败');
  }
});

/** 高风险账户监控 */
router.get('/risk/monitor', async (req, res) => {
  try {
    const [warningConfig] = await query(
      "SELECT config_value FROM system_config WHERE config_key = 'warning_line'"
    );
    const warningLine = parseFloat(warningConfig?.config_value || 50);

    const accounts = await query(
      `SELECT fa.*, u.email, u.nickname, u.account_status,
              (fa.balance + fa.floating_pnl) as equity,
              CASE WHEN fa.frozen_margin > 0
                THEN ((fa.balance + fa.floating_pnl) / fa.frozen_margin * 100)
                ELSE 100
              END as margin_ratio
       FROM fund_accounts fa
       JOIN users u ON fa.user_id = u.id
       WHERE fa.frozen_margin > 0
       HAVING margin_ratio < ?
       ORDER BY margin_ratio ASC`,
      [warningLine]
    );

    ApiResponse.success(res, { warningLine, accounts });
  } catch (err) {
    ApiResponse.error(res, '获取监控数据失败');
  }
});

/** AML大额/可疑交易记录 */
router.get('/risk/aml', async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(pageSize);

    const AML_THRESHOLD = 50000;

    const [{ total }] = await query(
      `SELECT COUNT(*) as total FROM trade_orders WHERE ABS(margin * leverage) >= ?`,
      [AML_THRESHOLD]
    );

    const records = await query(
      `SELECT o.*, u.email as user_email, u.nickname as user_nickname,
              ts.name as symbol_name, ABS(o.margin * o.leverage) as trade_amount
       FROM trade_orders o
       LEFT JOIN users u ON o.user_id = u.id
       LEFT JOIN trading_symbols ts ON o.symbol = ts.symbol
       WHERE ABS(o.margin * o.leverage) >= ?
       ORDER BY o.created_at DESC LIMIT ? OFFSET ?`,
      [AML_THRESHOLD, parseInt(pageSize), offset]
    );

    ApiResponse.paginate(res, { list: records, total, page: parseInt(page), pageSize: parseInt(pageSize) });
  } catch (err) {
    ApiResponse.error(res, '获取AML记录失败');
  }
});

module.exports = router;
