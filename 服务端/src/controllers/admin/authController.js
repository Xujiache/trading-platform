const bcrypt = require('bcryptjs');
const { body } = require('express-validator');
const { query } = require('../../config/database');
const { generateTokens } = require('../../middleware/auth');
const ApiResponse = require('../../utils/response');

function parsePermissions(val) { return val ? (typeof val === 'string' ? JSON.parse(val) : val) : []; }

exports.loginValidation = [
  body('username').notEmpty().withMessage('请输入用户名'),
  body('password').notEmpty().withMessage('请输入密码'),
];

exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    const [admin] = await query(
      `SELECT a.*, r.name as role_name, r.display_name as role_display_name, r.permissions
       FROM admins a LEFT JOIN roles r ON a.role_id = r.id
       WHERE a.username = ?`,
      [username]
    );
    if (!admin) {
      return ApiResponse.badRequest(res, '用户名或密码错误');
    }

    if (admin.status !== 1) {
      return ApiResponse.badRequest(res, '账户已被禁用');
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return ApiResponse.badRequest(res, '用户名或密码错误');
    }

    await query(
      'UPDATE admins SET last_login_at = NOW(), last_login_ip = ? WHERE id = ?',
      [req.ip || '', admin.id]
    );

    const tokens = generateTokens(
      { id: admin.id, username: admin.username, roleId: admin.role_id },
      'admin'
    );

    const permissions = parsePermissions(admin.permissions);

    ApiResponse.success(res, {
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      adminInfo: {
        id: admin.id,
        username: admin.username,
        realName: admin.real_name,
        email: admin.email,
        avatar: admin.avatar,
        roleName: admin.role_name,
        roleDisplayName: admin.role_display_name,
        permissions,
      },
    }, '登录成功');
  } catch (error) {
    next(error);
  }
};

exports.getInfo = async (req, res, next) => {
  try {
    const [admin] = await query(
      `SELECT a.id, a.username, a.real_name, a.email, a.phone, a.avatar, a.role_id,
              a.last_login_at, a.created_at,
              r.name as role_name, r.display_name as role_display_name, r.permissions
       FROM admins a LEFT JOIN roles r ON a.role_id = r.id
       WHERE a.id = ?`,
      [req.admin.id]
    );
    if (!admin) {
      return ApiResponse.notFound(res, '管理员不存在');
    }

    const permissions = parsePermissions(admin.permissions);

    ApiResponse.success(res, {
      ...admin,
      permissions,
    });
  } catch (error) {
    next(error);
  }
};

exports.changePasswordValidation = [
  body('oldPassword').notEmpty().withMessage('请输入当前密码'),
  body('newPassword').isLength({ min: 6 }).withMessage('新密码至少6位'),
];

exports.changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const [admin] = await query('SELECT id, password FROM admins WHERE id = ?', [req.admin.id]);
    if (!admin) {
      return ApiResponse.notFound(res, '管理员不存在');
    }

    const isMatch = await bcrypt.compare(oldPassword, admin.password);
    if (!isMatch) {
      return ApiResponse.badRequest(res, '当前密码错误');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await query('UPDATE admins SET password = ? WHERE id = ?', [hashedPassword, admin.id]);

    ApiResponse.success(res, null, '密码修改成功');
  } catch (error) {
    next(error);
  }
};
