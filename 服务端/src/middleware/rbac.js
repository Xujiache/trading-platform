const ApiResponse = require('../utils/response');
const { query } = require('../config/database');

function checkPermission(...requiredPermissions) {
  return async (req, res, next) => {
    try {
      const admin = req.admin;
      if (!admin || !admin.id) {
        return ApiResponse.forbidden(res, '需要管理员权限');
      }

      const [adminRow] = await query(
        'SELECT role_id FROM admins WHERE id = ? AND status = 1',
        [admin.id]
      );
      if (!adminRow) {
        return ApiResponse.forbidden(res, '管理员账户不存在或已禁用');
      }

      const [role] = await query(
        'SELECT * FROM roles WHERE id = ?',
        [adminRow.role_id]
      );
      if (!role) {
        return ApiResponse.forbidden(res, '角色不存在');
      }

      if (role.name === 'super_admin') {
        return next();
      }

      const permissions = role.permissions ? (typeof role.permissions === 'string' ? JSON.parse(role.permissions) : role.permissions) : [];
      const hasPermission = requiredPermissions.some(p => permissions.includes(p));
      if (!hasPermission) {
        return ApiResponse.forbidden(res, '权限不足，无法执行此操作');
      }

      next();
    } catch (error) {
      console.error('[RBAC] 权限检查失败:', error.message);
      return ApiResponse.error(res, '权限验证失败', 500);
    }
  };
}

module.exports = { checkPermission };
