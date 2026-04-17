const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { authenticateAdmin } = require('../../middleware/auth');
const { auditLog } = require('../../middleware/auditLog');
const ApiResponse = require('../../utils/response');
const { query } = require('../../config/database');

router.use(authenticateAdmin);

/** 用户列表(分页+搜索) */
router.get('/users', async (req, res) => {
  try {
    const { email, kycStatus, accountStatus, accountType, page = 1, pageSize = 20 } = req.query;
    const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(pageSize);
    const conditions = [];
    const params = [];

    if (email) { conditions.push('u.email LIKE ?'); params.push(`%${email}%`); }
    if (kycStatus) { conditions.push('u.kyc_status = ?'); params.push(kycStatus); }
    if (accountStatus) { conditions.push('u.account_status = ?'); params.push(accountStatus); }
    if (accountType) { conditions.push('u.account_type = ?'); params.push(accountType); }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [{ total }] = await query(`SELECT COUNT(*) as total FROM users u ${where}`, params);

    const users = await query(
      `SELECT u.id, u.email, u.nickname, u.avatar, u.real_name, u.kyc_status,
              u.risk_level, u.account_type, u.account_status, u.user_level,
              u.two_factor_enabled, u.login_count, u.last_login_at, u.created_at,
              fa.balance, fa.frozen_margin, fa.floating_pnl
       FROM users u
       LEFT JOIN fund_accounts fa ON u.id = fa.user_id AND u.account_type = fa.account_type
       ${where}
       ORDER BY u.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    );

    ApiResponse.paginate(res, { list: users, total, page: parseInt(page), pageSize: parseInt(pageSize) });
  } catch (err) {
    ApiResponse.error(res, '获取用户列表失败');
  }
});

/** 用户详情(含资金账户和近期订单) */
router.get('/users/:id', async (req, res) => {
  try {
    const [user] = await query(
      `SELECT id, email, nickname, avatar, real_name, id_card, kyc_status,
              kyc_reject_reason, kyc_front_image, kyc_back_image, kyc_face_image,
              kyc_submitted_at, kyc_reviewed_at, risk_level, account_type,
              account_status, freeze_reason, user_level, two_factor_enabled,
              login_count, last_login_at, last_login_ip, created_at
       FROM users WHERE id = ?`,
      [req.params.id]
    );
    if (!user) return ApiResponse.notFound(res, '用户不存在');

    const accounts = await query(
      'SELECT * FROM fund_accounts WHERE user_id = ?', [req.params.id]
    );

    const recentOrders = await query(
      `SELECT id, order_no, symbol, direction, lots, leverage, open_price,
              close_price, realized_pnl, net_pnl, status, opened_at, closed_at
       FROM trade_orders WHERE user_id = ?
       ORDER BY created_at DESC LIMIT 10`,
      [req.params.id]
    );

    user.accounts = accounts;
    user.recentOrders = recentOrders;

    ApiResponse.success(res, user);
  } catch (err) {
    ApiResponse.error(res, '获取用户详情失败');
  }
});

/** KYC审核(通过/驳回) */
router.post('/users/:id/kyc-review', auditLog('用户管理', 'KYC审核', { targetType: 'user' }), async (req, res) => {
  try {
    const { action, reason } = req.body;
    if (!['approved', 'rejected'].includes(action)) {
      return ApiResponse.badRequest(res, '无效的审核操作');
    }

    const [user] = await query('SELECT kyc_status FROM users WHERE id = ?', [req.params.id]);
    if (!user) return ApiResponse.notFound(res, '用户不存在');
    if (user.kyc_status !== 'pending') return ApiResponse.badRequest(res, '该用户无待审核的KYC');

    if (action === 'rejected' && !reason) {
      return ApiResponse.badRequest(res, '驳回时请填写原因');
    }

    await query(
      `UPDATE users SET kyc_status = ?, kyc_reject_reason = ?, kyc_reviewed_at = NOW() WHERE id = ?`,
      [action, action === 'rejected' ? reason : '', req.params.id]
    );

    ApiResponse.success(res, null, action === 'approved' ? 'KYC审核通过' : 'KYC已驳回');
  } catch (err) {
    ApiResponse.error(res, '审核失败');
  }
});

/** 冻结/解冻用户 */
router.post('/users/:id/toggle-status', auditLog('用户管理', '冻结/解冻用户', { targetType: 'user' }), async (req, res) => {
  try {
    const { reason } = req.body;
    const [user] = await query('SELECT account_status FROM users WHERE id = ?', [req.params.id]);
    if (!user) return ApiResponse.notFound(res, '用户不存在');

    const newStatus = user.account_status === 'active' ? 'frozen' : 'active';
    await query(
      'UPDATE users SET account_status = ?, freeze_reason = ? WHERE id = ?',
      [newStatus, newStatus === 'frozen' ? (reason || '') : '', req.params.id]
    );

    ApiResponse.success(res, { status: newStatus }, newStatus === 'frozen' ? '用户已冻结' : '用户已解冻');
  } catch (err) {
    ApiResponse.error(res, '操作失败');
  }
});

/** 重置用户密码 */
router.post('/users/:id/reset-password', auditLog('用户管理', '重置用户密码', { targetType: 'user' }), async (req, res) => {
  try {
    const [user] = await query('SELECT id FROM users WHERE id = ?', [req.params.id]);
    if (!user) return ApiResponse.notFound(res, '用户不存在');

    const chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhjkmnprstwxyz2345678';
    let newPassword = '';
    for (let i = 0; i < 8; i++) {
      newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await query('UPDATE users SET password = ? WHERE id = ?', [hashed, req.params.id]);

    ApiResponse.success(res, { newPassword }, '密码重置成功');
  } catch (err) {
    ApiResponse.error(res, '重置失败');
  }
});

module.exports = router;
