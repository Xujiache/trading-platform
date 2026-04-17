const { query } = require('../../config/database');
const ApiResponse = require('../../utils/response');

exports.list = async (req, res, next) => {
  try {
    const { module, admin_username, status, start_date, end_date, page = 1, pageSize = 20 } = req.query;
    const offset = (page - 1) * pageSize;
    let where = 'WHERE 1=1';
    const params = [];

    if (module) {
      where += ' AND module = ?';
      params.push(module);
    }
    if (admin_username) {
      where += ' AND admin_username LIKE ?';
      params.push(`%${admin_username}%`);
    }
    if (status) {
      where += ' AND status = ?';
      params.push(status);
    }
    if (start_date) {
      where += ' AND created_at >= ?';
      params.push(start_date);
    }
    if (end_date) {
      where += ' AND created_at <= ?';
      params.push(end_date + ' 23:59:59');
    }

    const [countRow] = await query(`SELECT COUNT(*) as total FROM operation_logs ${where}`, params);
    const list = await query(
      `SELECT id, admin_id, admin_username, module, action, ip, status, created_at
       FROM operation_logs ${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
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

exports.modules = async (req, res, next) => {
  try {
    const rows = await query('SELECT DISTINCT module FROM operation_logs ORDER BY module');
    ApiResponse.success(res, rows.map(r => r.module));
  } catch (error) {
    next(error);
  }
};

exports.detail = async (req, res, next) => {
  try {
    const [log] = await query('SELECT * FROM operation_logs WHERE id = ?', [req.params.id]);
    if (!log) {
      return ApiResponse.notFound(res, '日志不存在');
    }
    ApiResponse.success(res, log);
  } catch (error) {
    next(error);
  }
};
