const router = require('express').Router();
const bcrypt = require('bcryptjs');
const multer = require('multer');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { authenticateToken } = require('../../middleware/auth');
const ApiResponse = require('../../utils/response');
const { query } = require('../../config/database');

const path = require('path');
const fs = require('fs');
const config = require('../../config');

const upload = multer({ dest: 'uploads/kyc/' });

const avatarStorage = multer.diskStorage({
  destination(req, file, cb) {
    const dir = path.join(process.cwd(), config.upload.dir, 'avatar');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${req.user.id}_${Date.now()}${ext}`);
  },
});
const avatarUpload = multer({ storage: avatarStorage, limits: { fileSize: config.upload.maxSize } });

router.use(authenticateToken);

/** 上传头像 */
router.post('/avatar', avatarUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) return ApiResponse.badRequest(res, '请选择图片');
    const avatarUrl = `/uploads/avatar/${req.file.filename}`;
    await query('UPDATE users SET avatar = ? WHERE id = ?', [avatarUrl, req.user.id]);
    ApiResponse.success(res, { url: avatarUrl }, '头像更新成功');
  } catch (err) {
    ApiResponse.error(res, '头像上传失败');
  }
});

/** 上传KYC图片 */
router.post('/kyc/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return ApiResponse.badRequest(res, '请选择文件');
    const fileUrl = `/uploads/kyc/${req.file.filename}`;
    ApiResponse.success(res, { url: fileUrl }, '上传成功');
  } catch (err) {
    ApiResponse.error(res, '上传失败');
  }
});

/** 提交KYC认证 */
router.post('/kyc/submit', async (req, res) => {
  try {
    const { real_name, id_card, front_image, back_image, face_image } = req.body;
    if (!real_name || !id_card || !front_image || !back_image || !face_image) {
      return ApiResponse.badRequest(res, '请完整填写认证资料');
    }

    const [user] = await query('SELECT kyc_status FROM users WHERE id = ?', [req.user.id]);
    if (!user) return ApiResponse.notFound(res, '用户不存在');
    if (user.kyc_status === 'approved') return ApiResponse.badRequest(res, '已通过认证，无需重复提交');
    if (user.kyc_status === 'pending') return ApiResponse.badRequest(res, '认证审核中，请耐心等待');

    await query(
      `UPDATE users SET real_name = ?, id_card = ?, kyc_front_image = ?, kyc_back_image = ?,
       kyc_face_image = ?, kyc_status = 'pending', kyc_reject_reason = '', kyc_submitted_at = NOW()
       WHERE id = ?`,
      [real_name, id_card, front_image, back_image, face_image, req.user.id]
    );

    ApiResponse.success(res, null, 'KYC提交成功，请等待审核');
  } catch (err) {
    ApiResponse.error(res, '提交失败');
  }
});

/** 查询KYC状态 */
router.get('/kyc/status', async (req, res) => {
  try {
    const [user] = await query(
      `SELECT kyc_status, kyc_reject_reason, real_name, id_card,
              kyc_front_image, kyc_back_image, kyc_face_image,
              kyc_submitted_at, kyc_reviewed_at FROM users WHERE id = ?`,
      [req.user.id]
    );
    if (!user) return ApiResponse.notFound(res, '用户不存在');
    ApiResponse.success(res, user);
  } catch (err) {
    ApiResponse.error(res, '查询失败');
  }
});

/** 修改登录密码 */
router.post('/change-password', async (req, res) => {
  try {
    const { old_password, new_password } = req.body;
    if (!old_password || !new_password) return ApiResponse.badRequest(res, '请填写完整');
    if (new_password.length < 8) return ApiResponse.badRequest(res, '新密码至少8位');

    const [user] = await query('SELECT password FROM users WHERE id = ?', [req.user.id]);
    if (!user) return ApiResponse.notFound(res, '用户不存在');

    const isMatch = await bcrypt.compare(old_password, user.password);
    if (!isMatch) return ApiResponse.badRequest(res, '原密码错误');

    const hashed = await bcrypt.hash(new_password, 10);
    await query('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.id]);
    ApiResponse.success(res, null, '密码修改成功');
  } catch (err) {
    ApiResponse.error(res, '修改失败');
  }
});

/** 设置/修改交易密码 */
router.post('/trade-password', async (req, res) => {
  try {
    const { password, old_password } = req.body;
    if (!password || password.length < 6) return ApiResponse.badRequest(res, '交易密码至少6位');

    const [user] = await query('SELECT trade_password FROM users WHERE id = ?', [req.user.id]);
    if (user.trade_password) {
      if (!old_password) return ApiResponse.badRequest(res, '请输入原交易密码');
      const isMatch = await bcrypt.compare(old_password, user.trade_password);
      if (!isMatch) return ApiResponse.badRequest(res, '原交易密码错误');
    }

    const hashed = await bcrypt.hash(password, 10);
    await query('UPDATE users SET trade_password = ? WHERE id = ?', [hashed, req.user.id]);
    ApiResponse.success(res, null, '交易密码设置成功');
  } catch (err) {
    ApiResponse.error(res, '设置失败');
  }
});

/** 设置/修改资金密码 */
router.post('/fund-password', async (req, res) => {
  try {
    const { password, old_password } = req.body;
    if (!password || password.length < 6) return ApiResponse.badRequest(res, '资金密码至少6位');

    const [user] = await query('SELECT fund_password FROM users WHERE id = ?', [req.user.id]);
    if (user.fund_password) {
      if (!old_password) return ApiResponse.badRequest(res, '请输入原资金密码');
      const isMatch = await bcrypt.compare(old_password, user.fund_password);
      if (!isMatch) return ApiResponse.badRequest(res, '原资金密码错误');
    }

    const hashed = await bcrypt.hash(password, 10);
    await query('UPDATE users SET fund_password = ? WHERE id = ?', [hashed, req.user.id]);
    ApiResponse.success(res, null, '资金密码设置成功');
  } catch (err) {
    ApiResponse.error(res, '设置失败');
  }
});

/** 更新个人资料 */
router.put('/profile', async (req, res) => {
  try {
    const { nickname, avatar } = req.body;
    const updates = [];
    const params = [];

    if (nickname !== undefined) { updates.push('nickname = ?'); params.push(nickname); }
    if (avatar !== undefined) { updates.push('avatar = ?'); params.push(avatar); }

    if (updates.length === 0) return ApiResponse.badRequest(res, '无可更新的字段');

    params.push(req.user.id);
    await query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
    ApiResponse.success(res, null, '更新成功');
  } catch (err) {
    ApiResponse.error(res, '更新失败');
  }
});

/** 切换账户类型 */
router.post('/switch-account', async (req, res) => {
  try {
    const { account_type } = req.body;
    if (!['real', 'demo'].includes(account_type)) return ApiResponse.badRequest(res, '无效的账户类型');

    await query('UPDATE users SET account_type = ? WHERE id = ?', [account_type, req.user.id]);

    const existing = await query(
      'SELECT id FROM fund_accounts WHERE user_id = ? AND account_type = ?',
      [req.user.id, account_type]
    );
    if (existing.length === 0) {
      const initBalance = account_type === 'demo' ? 10000 : 0;
      await query(
        'INSERT INTO fund_accounts (user_id, account_type, balance) VALUES (?, ?, ?)',
        [req.user.id, account_type, initBalance]
      );
    }

    ApiResponse.success(res, { account_type }, '切换成功');
  } catch (err) {
    ApiResponse.error(res, '切换失败');
  }
});

/** 提交风险测评 */
router.post('/risk-assessment', async (req, res) => {
  try {
    const { answers } = req.body;
    if (!answers || !Array.isArray(answers)) return ApiResponse.badRequest(res, '请提交测评答案');

    const totalScore = answers.reduce((sum, a) => sum + (parseInt(a.score) || 0), 0);
    let level = 'conservative';
    if (totalScore > 75) level = 'professional';
    else if (totalScore > 50) level = 'aggressive';
    else if (totalScore > 25) level = 'moderate';

    await query('UPDATE users SET risk_level = ? WHERE id = ?', [level, req.user.id]);
    ApiResponse.success(res, { score: totalScore, level }, '测评完成');
  } catch (err) {
    ApiResponse.error(res, '提交失败');
  }
});

/** 获取测评结果 */
router.get('/risk-assessment', async (req, res) => {
  try {
    const [user] = await query('SELECT risk_level FROM users WHERE id = ?', [req.user.id]);
    if (!user) return ApiResponse.notFound(res, '用户不存在');
    ApiResponse.success(res, { level: user.risk_level });
  } catch (err) {
    ApiResponse.error(res, '查询失败');
  }
});

/** 获取2FA状态 */
router.get('/2fa/status', async (req, res) => {
  try {
    const [user] = await query(
      'SELECT two_factor_enabled FROM users WHERE id = ?', [req.user.id]
    );
    ApiResponse.success(res, { enabled: !!user.two_factor_enabled });
  } catch (err) {
    ApiResponse.error(res, '查询失败');
  }
});

/** 生成2FA密钥 */
router.post('/2fa/generate', async (req, res) => {
  try {
    const [user] = await query('SELECT email, two_factor_enabled FROM users WHERE id = ?', [req.user.id]);
    if (user.two_factor_enabled) return ApiResponse.badRequest(res, '2FA已启用');

    const secret = speakeasy.generateSecret({
      name: `TradingSystem:${user.email}`,
      issuer: 'TradingSystem'
    });

    await query('UPDATE users SET two_factor_secret = ? WHERE id = ?', [secret.base32, req.user.id]);

    const qrUrl = await QRCode.toDataURL(secret.otpauth_url);
    ApiResponse.success(res, { secret: secret.base32, qrCode: qrUrl });
  } catch (err) {
    ApiResponse.error(res, '生成失败');
  }
});

/** 启用2FA */
router.post('/2fa/enable', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return ApiResponse.badRequest(res, '请输入验证码');

    const [user] = await query(
      'SELECT two_factor_secret, two_factor_enabled FROM users WHERE id = ?', [req.user.id]
    );
    if (user.two_factor_enabled) return ApiResponse.badRequest(res, '2FA已启用');
    if (!user.two_factor_secret) return ApiResponse.badRequest(res, '请先生成密钥');

    const verified = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token: token,
      window: 2
    });

    if (!verified) return ApiResponse.badRequest(res, '验证码错误');

    await query('UPDATE users SET two_factor_enabled = 1 WHERE id = ?', [req.user.id]);
    ApiResponse.success(res, null, '2FA已启用');
  } catch (err) {
    ApiResponse.error(res, '启用失败');
  }
});

/** 关闭2FA */
router.post('/2fa/disable', async (req, res) => {
  try {
    const { password, token } = req.body;
    if (!password || !token) return ApiResponse.badRequest(res, '请输入密码和验证码');

    const [user] = await query(
      'SELECT password, two_factor_secret, two_factor_enabled FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!user.two_factor_enabled) return ApiResponse.badRequest(res, '2FA未启用');

    const pwMatch = await bcrypt.compare(password, user.password);
    if (!pwMatch) return ApiResponse.badRequest(res, '密码错误');

    const verified = speakeasy.totp.verify({
      secret: user.two_factor_secret, encoding: 'base32', token, window: 2
    });
    if (!verified) return ApiResponse.badRequest(res, '验证码错误');

    await query(
      'UPDATE users SET two_factor_enabled = 0, two_factor_secret = ? WHERE id = ?',
      ['', req.user.id]
    );
    ApiResponse.success(res, null, '2FA已关闭');
  } catch (err) {
    ApiResponse.error(res, '关闭失败');
  }
});

module.exports = router;
