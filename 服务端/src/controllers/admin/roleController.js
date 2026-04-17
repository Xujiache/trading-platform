const { body, param } = require('express-validator');
const { query } = require('../../config/database');
const ApiResponse = require('../../utils/response');

exports.list = async (req, res, next) => {
  try {
    const { keyword, page = 1, pageSize = 20 } = req.query;
    const offset = (page - 1) * pageSize;
    let where = 'WHERE 1=1';
    const params = [];

    if (keyword) {
      where += ' AND (name LIKE ? OR display_name LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    const [countRow] = await query(`SELECT COUNT(*) as total FROM roles ${where}`, params);
    const list = await query(
      `SELECT * FROM roles ${where} ORDER BY sort_order ASC, id ASC LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), parseInt(offset)]
    );

    ApiResponse.paginate(res, {
      list,
      total: countRow.total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    });
  } catch (error) {
    next(error);
  }
};

exports.detail = async (req, res, next) => {
  try {
    const [role] = await query('SELECT * FROM roles WHERE id = ?', [req.params.id]);
    if (!role) {
      return ApiResponse.notFound(res, '角色不存在');
    }
    role.permissions = role.permissions ? (typeof role.permissions === 'string' ? JSON.parse(role.permissions) : role.permissions) : [];
    ApiResponse.success(res, role);
  } catch (error) {
    next(error);
  }
};

exports.createValidation = [
  body('name').notEmpty().withMessage('角色标识不能为空'),
  body('display_name').notEmpty().withMessage('显示名称不能为空'),
];

exports.create = async (req, res, next) => {
  try {
    const { name, display_name, description, permissions, sort_order } = req.body;

    const [existing] = await query('SELECT id FROM roles WHERE name = ?', [name]);
    if (existing) {
      return ApiResponse.badRequest(res, '角色标识已存在');
    }

    const result = await query(
      `INSERT INTO roles (name, display_name, description, permissions, sort_order)
       VALUES (?, ?, ?, ?, ?)`,
      [name, display_name, description || '', JSON.stringify(permissions || []), sort_order || 0]
    );

    ApiResponse.success(res, { id: result.insertId }, '角色创建成功');
  } catch (error) {
    next(error);
  }
};

exports.updateValidation = [
  param('id').isInt().withMessage('角色ID无效'),
  body('display_name').notEmpty().withMessage('显示名称不能为空'),
];

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { display_name, description, permissions, status, sort_order } = req.body;

    const [role] = await query('SELECT * FROM roles WHERE id = ?', [id]);
    if (!role) {
      return ApiResponse.notFound(res, '角色不存在');
    }

    await query(
      `UPDATE roles SET display_name = ?, description = ?, permissions = ?, status = ?, sort_order = ?
       WHERE id = ?`,
      [
        display_name || role.display_name,
        description !== undefined ? description : role.description,
        JSON.stringify(permissions || (typeof role.permissions === 'string' ? JSON.parse(role.permissions || '[]') : (role.permissions || []))),
        status !== undefined ? status : role.status,
        sort_order !== undefined ? sort_order : role.sort_order,
        id,
      ]
    );

    ApiResponse.success(res, null, '角色更新成功');
  } catch (error) {
    next(error);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [role] = await query('SELECT * FROM roles WHERE id = ?', [id]);
    if (!role) {
      return ApiResponse.notFound(res, '角色不存在');
    }

    if (role.is_system) {
      return ApiResponse.badRequest(res, '系统内置角色不可删除');
    }

    const [adminCount] = await query(
      'SELECT COUNT(*) as count FROM admins WHERE role_id = ?', [id]
    );
    if (adminCount.count > 0) {
      return ApiResponse.badRequest(res, '该角色下还有管理员，无法删除');
    }

    await query('DELETE FROM roles WHERE id = ?', [id]);
    ApiResponse.success(res, null, '角色删除成功');
  } catch (error) {
    next(error);
  }
};
