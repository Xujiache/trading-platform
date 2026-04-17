const express = require('express');
const router = express.Router();
const { authenticateAdmin } = require('../../middleware/auth');
const { checkPermission } = require('../../middleware/rbac');
const { logOperation } = require('../../middleware/operationLog');
const ApiResponse = require('../../utils/response');
const { pool, query } = require('../../config/database');
const { redis } = require('../../config/redis');
const { getMonitorStatus } = require('../../services/marketMonitorService');

router.use(authenticateAdmin);

// ======================== T7.2 系统健康检查 ========================

router.get('/system/health', checkPermission('system:config'), async (req, res) => {
  try {
    const health = { timestamp: new Date().toISOString(), status: 'healthy', components: {} };

    try {
      const start = Date.now();
      const conn = await pool.getConnection();
      const [rows] = await conn.query('SELECT 1 AS ok');
      conn.release();
      const poolStatus = pool.pool;
      health.components.database = {
        status: 'up',
        latencyMs: Date.now() - start,
        pool: {
          total: poolStatus ? poolStatus._allConnections?.length || 0 : 0,
          idle: poolStatus ? poolStatus._freeConnections?.length || 0 : 0,
          waiting: poolStatus ? poolStatus._connectionQueue?.length || 0 : 0,
        },
      };
    } catch (e) {
      health.components.database = { status: 'down', error: e.message };
      health.status = 'unhealthy';
    }

    try {
      const start = Date.now();
      const pong = await redis.ping();
      const info = await redis.info('clients').catch(() => '');
      const connectedClients = info.match(/connected_clients:(\d+)/)?.[1] || '0';
      health.components.redis = {
        status: pong === 'PONG' ? 'up' : 'down',
        latencyMs: Date.now() - start,
        connectedClients: parseInt(connectedClients),
      };
    } catch (e) {
      health.components.redis = { status: 'down', error: e.message };
      if (health.status === 'healthy') health.status = 'degraded';
    }

    health.components.marketMonitor = getMonitorStatus();

    health.components.system = {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      nodeVersion: process.version,
      platform: process.platform,
      pid: process.pid,
    };

    ApiResponse.success(res, health);
  } catch (err) {
    ApiResponse.error(res, '健康检查失败: ' + err.message);
  }
});

router.get('/health', async (req, res) => {
  try {
    let dbOk = false;
    try {
      const conn = await pool.getConnection();
      conn.release();
      dbOk = true;
    } catch (_) {}

    let redisOk = false;
    try {
      const pong = await redis.ping();
      redisOk = pong === 'PONG';
    } catch (_) {}

    const status = dbOk ? (redisOk ? 'healthy' : 'degraded') : 'unhealthy';
    res.status(dbOk ? 200 : 503).json({
      code: dbOk ? 200 : 503,
      msg: 'OK',
      data: { status, database: dbOk ? 'up' : 'down', redis: redisOk ? 'up' : 'down', timestamp: new Date().toISOString() },
    });
  } catch (err) {
    res.status(503).json({ code: 503, msg: 'Service Unavailable', data: { status: 'unhealthy' } });
  }
});

// ======================== T7.4 CSV 数据导出 ========================

const EXPORT_CONFIGS = {
  users: {
    permission: 'data:export',
    sql: `SELECT id, email, nickname, real_name, kyc_status, account_type, account_status,
          user_level, login_count, last_login_at, created_at FROM users`,
    headers: ['ID', '邮箱', '昵称', '真实姓名', 'KYC状态', '账户类型', '账户状态', '用户等级', '登录次数', '最后登录', '注册时间'],
    fields: ['id', 'email', 'nickname', 'real_name', 'kyc_status', 'account_type', 'account_status', 'user_level', 'login_count', 'last_login_at', 'created_at'],
    filename: 'users',
  },
  orders: {
    permission: 'data:export',
    sql: `SELECT o.id, o.order_no, o.user_id, u.email AS user_email, o.symbol, o.direction, o.lots, o.leverage,
          o.open_price, o.close_price, o.margin, o.commission, o.swap_total, o.realized_pnl, o.net_pnl,
          o.status, o.close_type, o.account_type, o.opened_at, o.closed_at
          FROM trade_orders o LEFT JOIN users u ON o.user_id = u.id`,
    headers: ['ID', '订单号', '用户ID', '用户邮箱', '品种', '方向', '手数', '杠杆', '开仓价', '平仓价', '保证金', '手续费', '隔夜费', '盈亏', '净盈亏', '状态', '平仓方式', '账户类型', '开仓时间', '平仓时间'],
    fields: ['id', 'order_no', 'user_id', 'user_email', 'symbol', 'direction', 'lots', 'leverage', 'open_price', 'close_price', 'margin', 'commission', 'swap_total', 'realized_pnl', 'net_pnl', 'status', 'close_type', 'account_type', 'opened_at', 'closed_at'],
    filename: 'orders',
  },
  fund_flows: {
    permission: 'data:export',
    sql: `SELECT f.id, f.user_id, u.email AS user_email, f.account_type, f.flow_type, f.amount,
          f.balance_before, f.balance_after, f.ref_type, f.ref_id, f.description, f.created_at
          FROM fund_flows f LEFT JOIN users u ON f.user_id = u.id`,
    headers: ['ID', '用户ID', '用户邮箱', '账户类型', '流水类型', '金额', '变更前余额', '变更后余额', '关联类型', '关联ID', '描述', '创建时间'],
    fields: ['id', 'user_id', 'user_email', 'account_type', 'flow_type', 'amount', 'balance_before', 'balance_after', 'ref_type', 'ref_id', 'description', 'created_at'],
    filename: 'fund_flows',
  },
  deposits: {
    permission: 'data:export',
    sql: `SELECT d.id, d.deposit_no, d.user_id, u.email AS user_email, d.amount, d.payment_method,
          d.payment_ref, d.status, d.admin_remark, d.reviewed_at, d.created_at
          FROM deposits d LEFT JOIN users u ON d.user_id = u.id`,
    headers: ['ID', '入金单号', '用户ID', '用户邮箱', '金额', '支付方式', '支付流水', '状态', '审核备注', '审核时间', '创建时间'],
    fields: ['id', 'deposit_no', 'user_id', 'user_email', 'amount', 'payment_method', 'payment_ref', 'status', 'admin_remark', 'reviewed_at', 'created_at'],
    filename: 'deposits',
  },
  withdraws: {
    permission: 'data:export',
    sql: `SELECT w.id, w.withdraw_no, w.user_id, u.email AS user_email, w.amount, w.fee, w.actual_amount,
          w.withdraw_method, w.account_name, w.account_no, w.status, w.admin_remark, w.reviewed_at, w.completed_at, w.created_at
          FROM withdraws w LEFT JOIN users u ON w.user_id = u.id`,
    headers: ['ID', '出金单号', '用户ID', '用户邮箱', '金额', '手续费', '实际到账', '出金方式', '账户名', '账号', '状态', '审核备注', '审核时间', '完成时间', '创建时间'],
    fields: ['id', 'withdraw_no', 'user_id', 'user_email', 'amount', 'fee', 'actual_amount', 'withdraw_method', 'account_name', 'account_no', 'status', 'admin_remark', 'reviewed_at', 'completed_at', 'created_at'],
    filename: 'withdraws',
  },
  trade_flows: {
    permission: 'data:export',
    sql: `SELECT t.id, t.user_id, u.email AS user_email, t.account_type, t.order_id, t.flow_type,
          t.amount, t.balance_before, t.balance_after, t.description, t.created_at
          FROM trade_flows t LEFT JOIN users u ON t.user_id = u.id`,
    headers: ['ID', '用户ID', '用户邮箱', '账户类型', '订单ID', '流水类型', '金额', '变更前余额', '变更后余额', '描述', '创建时间'],
    fields: ['id', 'user_id', 'user_email', 'account_type', 'order_id', 'flow_type', 'amount', 'balance_before', 'balance_after', 'description', 'created_at'],
    filename: 'trade_flows',
  },
};

function escapeCsvField(val) {
  if (val == null) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

router.get('/export/:type', checkPermission('data:export'), logOperation('数据导出', '导出CSV'), async (req, res) => {
  try {
    const exportType = req.params.type;
    const config = EXPORT_CONFIGS[exportType];
    if (!config) {
      return ApiResponse.badRequest(res, `不支持的导出类型: ${exportType}，可选: ${Object.keys(EXPORT_CONFIGS).join(', ')}`);
    }

    let sqlQuery = config.sql;
    const params = [];
    const { start_date, end_date, status: filterStatus, user_id } = req.query;

    const conditions = [];
    if (start_date) { conditions.push(`${exportType === 'users' ? '' : (exportType[0] + '.')}created_at >= ?`); params.push(start_date); }
    if (end_date) { conditions.push(`${exportType === 'users' ? '' : (exportType[0] + '.')}created_at <= ?`); params.push(end_date + ' 23:59:59'); }
    if (filterStatus) { conditions.push(`${exportType === 'users' ? '' : (exportType[0] + '.')}status = ?`); params.push(filterStatus); }
    if (user_id && exportType !== 'users') { conditions.push(`${exportType[0]}.user_id = ?`); params.push(parseInt(user_id)); }

    if (conditions.length > 0) {
      sqlQuery += ' WHERE ' + conditions.join(' AND ');
    }
    sqlQuery += ` ORDER BY ${exportType === 'users' ? '' : (exportType[0] + '.')}created_at DESC LIMIT 50000`;

    const rows = await query(sqlQuery, params);

    const BOM = '\uFEFF';
    const headerLine = config.headers.map(escapeCsvField).join(',');
    const dataLines = rows.map(row => config.fields.map(f => escapeCsvField(row[f])).join(','));
    const csvContent = BOM + headerLine + '\n' + dataLines.join('\n');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${config.filename}_${timestamp}.csv"`);
    res.send(csvContent);
  } catch (err) {
    console.error('[Export] 导出失败:', err.message);
    ApiResponse.error(res, '数据导出失败: ' + err.message);
  }
});

router.get('/export-types', checkPermission('data:export'), async (req, res) => {
  const types = Object.entries(EXPORT_CONFIGS).map(([key, val]) => ({
    type: key,
    filename: val.filename,
    fieldCount: val.fields.length,
  }));
  ApiResponse.success(res, types);
});

// ======================== T7.5 批量确认入金 ========================

router.post('/batch/deposit-confirm', checkPermission('fund:manage'), logOperation('批量操作', '批量确认入金'), async (req, res) => {
  try {
    const { ids, remark } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return ApiResponse.badRequest(res, '请提供入金ID列表');
    if (ids.length > 100) return ApiResponse.badRequest(res, '单次最多处理100条');

    const results = { success: [], failed: [] };
    const conn = await pool.getConnection();
    try {
      for (const id of ids) {
        try {
          await conn.beginTransaction();
          const [[deposit]] = await conn.query('SELECT * FROM deposits WHERE id = ? AND status = ? FOR UPDATE', [id, 'pending']);
          if (!deposit) {
            results.failed.push({ id, reason: '入金记录不存在或状态非待处理' });
            await conn.rollback();
            continue;
          }

          await conn.query(`UPDATE deposits SET status = 'completed', admin_id = ?, admin_remark = ?, reviewed_at = NOW() WHERE id = ?`,
            [req.admin.id, remark || '批量确认', id]);

          const [[account]] = await conn.query('SELECT * FROM fund_accounts WHERE user_id = ? AND account_type = ?', [deposit.user_id, 'real']);
          if (account) {
            const newBalance = parseFloat(account.balance) + parseFloat(deposit.amount);
            await conn.query('UPDATE fund_accounts SET balance = ?, total_deposit = total_deposit + ? WHERE id = ?',
              [newBalance, deposit.amount, account.id]);
            await conn.query(`INSERT INTO fund_flows (user_id, account_type, flow_type, amount, balance_before, balance_after, ref_type, ref_id, description) VALUES (?,?,?,?,?,?,?,?,?)`,
              [deposit.user_id, 'real', 'deposit', deposit.amount, account.balance, newBalance, 'deposit', deposit.id, `入金确认-${deposit.deposit_no}`]);
          } else {
            await conn.query(`INSERT INTO fund_accounts (user_id, account_type, balance, total_deposit) VALUES (?, 'real', ?, ?)`,
              [deposit.user_id, deposit.amount, deposit.amount]);
            await conn.query(`INSERT INTO fund_flows (user_id, account_type, flow_type, amount, balance_before, balance_after, ref_type, ref_id, description) VALUES (?,?,?,?,?,?,?,?,?)`,
              [deposit.user_id, 'real', 'deposit', deposit.amount, 0, deposit.amount, 'deposit', deposit.id, `入金确认-${deposit.deposit_no}`]);
          }

          await conn.commit();
          results.success.push(id);
        } catch (e) {
          await conn.rollback();
          results.failed.push({ id, reason: e.message });
        }
      }
    } finally {
      conn.release();
    }

    ApiResponse.success(res, results, `批量确认完成: 成功${results.success.length}条, 失败${results.failed.length}条`);
  } catch (err) {
    ApiResponse.error(res, '批量确认入金失败: ' + err.message);
  }
});

// ======================== T7.6 批量审核出金 ========================

router.post('/batch/withdraw-audit', checkPermission('fund:manage'), logOperation('批量操作', '批量审核出金'), async (req, res) => {
  try {
    const { ids, action, remark } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return ApiResponse.badRequest(res, '请提供出金ID列表');
    if (ids.length > 100) return ApiResponse.badRequest(res, '单次最多处理100条');
    if (!['approve', 'reject', 'complete'].includes(action)) return ApiResponse.badRequest(res, 'action 须为 approve/reject/complete');

    const statusMap = { approve: 'approved', reject: 'rejected', complete: 'completed' };
    const validFrom = { approve: ['pending', 'reviewing'], reject: ['pending', 'reviewing'], complete: ['approved', 'processing'] };

    const results = { success: [], failed: [] };
    const conn = await pool.getConnection();
    try {
      for (const id of ids) {
        try {
          await conn.beginTransaction();
          const [[withdraw]] = await conn.query('SELECT * FROM withdraws WHERE id = ? FOR UPDATE', [id]);
          if (!withdraw) {
            results.failed.push({ id, reason: '出金记录不存在' });
            await conn.rollback();
            continue;
          }
          if (!validFrom[action].includes(withdraw.status)) {
            results.failed.push({ id, reason: `当前状态(${withdraw.status})不允许${action}操作` });
            await conn.rollback();
            continue;
          }

          const updates = { status: statusMap[action], admin_id: req.admin.id, admin_remark: remark || `批量${action}` };
          if (action === 'approve' || action === 'reject') updates.reviewed_at = new Date();
          if (action === 'complete') updates.completed_at = new Date();

          const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ');
          await conn.query(`UPDATE withdraws SET ${setClauses} WHERE id = ?`, [...Object.values(updates), id]);

          if (action === 'reject') {
            const [[account]] = await conn.query('SELECT * FROM fund_accounts WHERE user_id = ? AND account_type = ?', [withdraw.user_id, 'real']);
            if (account) {
              const refundAmount = parseFloat(withdraw.amount);
              const newBalance = parseFloat(account.balance) + refundAmount;
              await conn.query('UPDATE fund_accounts SET balance = ? WHERE id = ?', [newBalance, account.id]);
              await conn.query(`INSERT INTO fund_flows (user_id, account_type, flow_type, amount, balance_before, balance_after, ref_type, ref_id, description) VALUES (?,?,?,?,?,?,?,?,?)`,
                [withdraw.user_id, 'real', 'withdraw', refundAmount, account.balance, newBalance, 'withdraw', withdraw.id, `出金驳回退回-${withdraw.withdraw_no}`]);
            }
          }

          await conn.commit();
          results.success.push(id);
        } catch (e) {
          await conn.rollback();
          results.failed.push({ id, reason: e.message });
        }
      }
    } finally {
      conn.release();
    }

    ApiResponse.success(res, results, `批量审核完成: 成功${results.success.length}条, 失败${results.failed.length}条`);
  } catch (err) {
    ApiResponse.error(res, '批量审核出金失败: ' + err.message);
  }
});

// ======================== T7.7 批量冻结/解冻用户 ========================

router.post('/batch/user-status', checkPermission('user:manage'), logOperation('批量操作', '批量冻结/解冻用户'), async (req, res) => {
  try {
    const { ids, action, reason } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return ApiResponse.badRequest(res, '请提供用户ID列表');
    if (ids.length > 100) return ApiResponse.badRequest(res, '单次最多处理100条');
    if (!['freeze', 'unfreeze'].includes(action)) return ApiResponse.badRequest(res, 'action 须为 freeze/unfreeze');

    const newStatus = action === 'freeze' ? 'frozen' : 'active';
    const fromStatus = action === 'freeze' ? 'active' : 'frozen';

    const results = { success: [], failed: [] };
    for (const id of ids) {
      try {
        const [result] = await pool.query(
          'UPDATE users SET account_status = ?, freeze_reason = ? WHERE id = ? AND account_status = ?',
          [newStatus, action === 'freeze' ? (reason || '批量冻结') : '', id, fromStatus]
        );
        if (result.affectedRows > 0) {
          results.success.push(id);
        } else {
          results.failed.push({ id, reason: `用户不存在或当前不是${fromStatus}状态` });
        }
      } catch (e) {
        results.failed.push({ id, reason: e.message });
      }
    }

    ApiResponse.success(res, results, `批量${action === 'freeze' ? '冻结' : '解冻'}完成: 成功${results.success.length}条, 失败${results.failed.length}条`);
  } catch (err) {
    ApiResponse.error(res, '批量操作失败: ' + err.message);
  }
});

// ======================== T7.8 审计日志查询 ========================

router.get('/audit-logs', checkPermission('system:audit'), async (req, res) => {
  try {
    const { page = 1, pageSize = 20, module: mod, action, operator_name, status, start_date, end_date, target_type } = req.query;
    const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(pageSize);
    const limit = Math.min(100, Math.max(1, parseInt(pageSize)));

    let where = '1=1';
    const params = [];
    if (mod) { where += ' AND module = ?'; params.push(mod); }
    if (action) { where += ' AND action = ?'; params.push(action); }
    if (operator_name) { where += ' AND operator_name LIKE ?'; params.push(`%${operator_name}%`); }
    if (status) { where += ' AND status = ?'; params.push(status); }
    if (target_type) { where += ' AND target_type = ?'; params.push(target_type); }
    if (start_date) { where += ' AND created_at >= ?'; params.push(start_date); }
    if (end_date) { where += ' AND created_at <= ?'; params.push(end_date + ' 23:59:59'); }

    const [countRow] = await query(`SELECT COUNT(*) AS total FROM audit_logs WHERE ${where}`, params);
    const total = countRow.total;

    const list = await query(
      `SELECT id, operator_type, operator_id, operator_name, module, action, target_type, target_id,
       content, ip, status, error_message, duration_ms, created_at
       FROM audit_logs WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    ApiResponse.paginate(res, { list, total, page: parseInt(page), pageSize: limit });
  } catch (err) {
    ApiResponse.error(res, '查询审计日志失败: ' + err.message);
  }
});

router.get('/audit-logs/modules', checkPermission('system:audit'), async (req, res) => {
  try {
    const modules = await query('SELECT DISTINCT module FROM audit_logs ORDER BY module');
    const actions = await query('SELECT DISTINCT action FROM audit_logs ORDER BY action');
    ApiResponse.success(res, {
      modules: modules.map(m => m.module),
      actions: actions.map(a => a.action),
    });
  } catch (err) {
    ApiResponse.error(res, '获取审计日志模块列表失败');
  }
});

router.get('/audit-logs/:id', checkPermission('system:audit'), async (req, res) => {
  try {
    const [log] = await query('SELECT * FROM audit_logs WHERE id = ?', [req.params.id]);
    if (!log) return ApiResponse.notFound(res, '审计日志不存在');
    ApiResponse.success(res, log);
  } catch (err) {
    ApiResponse.error(res, '获取审计日志详情失败');
  }
});

// ======================== T7.10/T7.11 连接池监控 ========================

router.get('/monitor/connections', checkPermission('system:config'), async (req, res) => {
  try {
    const data = {};

    const poolInternal = pool.pool;
    data.database = {
      total: poolInternal?._allConnections?.length || 0,
      idle: poolInternal?._freeConnections?.length || 0,
      active: (poolInternal?._allConnections?.length || 0) - (poolInternal?._freeConnections?.length || 0),
      waiting: poolInternal?._connectionQueue?.length || 0,
      config: { connectionLimit: pool.pool?.config?.connectionLimit || 0 },
    };

    try {
      const info = await redis.info('clients');
      const connectedClients = info.match(/connected_clients:(\d+)/)?.[1] || '0';
      const blockedClients = info.match(/blocked_clients:(\d+)/)?.[1] || '0';
      const memInfo = await redis.info('memory');
      const usedMemory = memInfo.match(/used_memory_human:(\S+)/)?.[1] || 'N/A';
      data.redis = {
        status: 'up',
        connectedClients: parseInt(connectedClients),
        blockedClients: parseInt(blockedClients),
        usedMemory,
      };
    } catch (e) {
      data.redis = { status: 'down', error: e.message };
    }

    ApiResponse.success(res, data);
  } catch (err) {
    ApiResponse.error(res, '获取连接池状态失败');
  }
});

module.exports = router;
