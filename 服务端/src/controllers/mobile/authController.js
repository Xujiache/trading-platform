const bcrypt = require('bcryptjs');
const { body } = require('express-validator');
const { query } = require('../../config/database');
const { generateTokens } = require('../../middleware/auth');
const emailService = require('../../services/emailService');
const ApiResponse = require('../../utils/response');
const AppError = require('../../utils/AppError');

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,20}$/;

exports.sendCodeValidation = [
  body('email').isEmail().withMessage('请输入有效的邮箱地址'),
  body('type').isIn(['register', 'reset_password']).withMessage('业务类型无效'),
];

exports.sendCode = async (req, res, next) => {
  try {
    const { email, type } = req.body;

    if (type === 'register') {
      const [existing] = await query('SELECT id FROM users WHERE email = ?', [email]);
      if (existing) {
        return ApiResponse.badRequest(res, '该邮箱已注册');
      }
    }

    if (type === 'reset_password') {
      const [existing] = await query('SELECT id FROM users WHERE email = ?', [email]);
      if (!existing) {
        return ApiResponse.badRequest(res, '该邮箱未注册');
      }
    }

    await emailService.sendVerificationCode(email, type);
    ApiResponse.success(res, null, '验证码已发送');
  } catch (error) {
    next(error.message.includes('频繁') ? new AppError(error.message, 429) : error);
  }
};

exports.registerValidation = [
  body('email').isEmail().withMessage('请输入有效的邮箱地址'),
  body('code').notEmpty().withMessage('请输入验证码'),
  body('password').matches(passwordRegex).withMessage('密码需8-20位，包含大小写字母和数字'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) throw new Error('两次密码不一致');
    return true;
  }),
];

exports.register = async (req, res, next) => {
  try {
    const { email, code, password } = req.body;

    const [existing] = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      return ApiResponse.badRequest(res, '该邮箱已注册');
    }

    const valid = await emailService.verifyCode(email, code, 'register');
    if (!valid) {
      return ApiResponse.badRequest(res, '验证码无效或已过期');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await query(
      'INSERT INTO users (email, password, nickname) VALUES (?, ?, ?)',
      [email, hashedPassword, email.split('@')[0]]
    );

    const userId = result.insertId;
    const tokens = generateTokens({ id: userId, email }, 'user');

    ApiResponse.success(res, {
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      userInfo: { id: userId, email, nickname: email.split('@')[0], accountType: 'real' },
    }, '注册成功');
  } catch (error) {
    next(error);
  }
};

exports.loginValidation = [
  body('email').isEmail().withMessage('请输入有效的邮箱地址'),
  body('password').notEmpty().withMessage('请输入密码'),
];

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const [user] = await query(
      'SELECT id, email, password, nickname, avatar, account_type, account_status, kyc_status, risk_level, real_name FROM users WHERE email = ?',
      [email]
    );
    if (!user) {
      return ApiResponse.badRequest(res, '邮箱或密码错误');
    }

    if (user.account_status === 'frozen') {
      return ApiResponse.badRequest(res, '账户已被冻结，请联系客服');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return ApiResponse.badRequest(res, '邮箱或密码错误');
    }

    await query(
      'UPDATE users SET login_count = login_count + 1, last_login_at = NOW(), last_login_ip = ? WHERE id = ?',
      [req.ip || '', user.id]
    );

    const tokens = generateTokens({ id: user.id, email: user.email }, 'user');

    ApiResponse.success(res, {
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      userInfo: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        avatar: user.avatar,
        accountType: user.account_type,
        kycStatus: user.kyc_status,
        riskLevel: user.risk_level,
        realName: user.real_name,
      },
    }, '登录成功');
  } catch (error) {
    next(error);
  }
};

exports.resetPasswordValidation = [
  body('email').isEmail().withMessage('请输入有效的邮箱地址'),
  body('code').notEmpty().withMessage('请输入验证码'),
  body('newPassword').matches(passwordRegex).withMessage('密码需8-20位，包含大小写字母和数字'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.newPassword) throw new Error('两次密码不一致');
    return true;
  }),
];

exports.resetPassword = async (req, res, next) => {
  try {
    const { email, code, newPassword } = req.body;

    const [user] = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (!user) {
      return ApiResponse.badRequest(res, '该邮箱未注册');
    }

    const valid = await emailService.verifyCode(email, code, 'reset_password');
    if (!valid) {
      return ApiResponse.badRequest(res, '验证码无效或已过期');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user.id]);

    ApiResponse.success(res, null, '密码重置成功');
  } catch (error) {
    next(error);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const [user] = await query(
      `SELECT id, email, nickname, avatar, real_name, kyc_status, risk_level,
              account_type, account_status, user_level, two_factor_enabled,
              login_count, last_login_at, created_at
       FROM users WHERE id = ?`,
      [req.user.id]
    );
    if (!user) {
      return ApiResponse.notFound(res, '用户不存在');
    }
    ApiResponse.success(res, user);
  } catch (error) {
    next(error);
  }
};
