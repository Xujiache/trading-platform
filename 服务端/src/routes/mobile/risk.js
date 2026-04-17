const router = require('express').Router();
const { authenticateToken } = require('../../middleware/auth');
const ApiResponse = require('../../utils/response');
const { query } = require('../../config/database');

router.use(authenticateToken);

/** 我的风险预警列表 */
router.get('/alerts', async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(pageSize);

    const [{ total }] = await query(
      'SELECT COUNT(*) as total FROM risk_alerts WHERE user_id = ?', [req.user.id]
    );

    const alerts = await query(
      `SELECT id, alert_type, level, title, content, margin_ratio, status, created_at
       FROM risk_alerts WHERE user_id = ?
       ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [req.user.id, parseInt(pageSize), offset]
    );

    ApiResponse.paginate(res, { list: alerts, total, page: parseInt(page), pageSize: parseInt(pageSize) });
  } catch (err) {
    ApiResponse.error(res, '获取预警列表失败');
  }
});

/** 保证金状态查询 */
router.get('/margin-status', async (req, res) => {
  try {
    const [user] = await query('SELECT account_type FROM users WHERE id = ?', [req.user.id]);
    const [account] = await query(
      'SELECT balance, frozen_margin, floating_pnl FROM fund_accounts WHERE user_id = ? AND account_type = ?',
      [req.user.id, user.account_type]
    );

    if (!account) {
      return ApiResponse.success(res, {
        balance: 0, frozen_margin: 0, floating_pnl: 0,
        equity: 0, free_margin: 0, margin_ratio: 100
      });
    }

    const balance = parseFloat(account.balance);
    const frozenMargin = parseFloat(account.frozen_margin);
    const floatingPnl = parseFloat(account.floating_pnl);
    const equity = balance + floatingPnl;
    const freeMargin = equity - frozenMargin;
    const marginRatio = frozenMargin > 0 ? (equity / frozenMargin) * 100 : 100;

    ApiResponse.success(res, {
      balance, frozen_margin: frozenMargin, floating_pnl: floatingPnl,
      equity: parseFloat(equity.toFixed(4)),
      free_margin: parseFloat(freeMargin.toFixed(4)),
      margin_ratio: parseFloat(marginRatio.toFixed(2))
    });
  } catch (err) {
    ApiResponse.error(res, '查询失败');
  }
});

module.exports = router;
