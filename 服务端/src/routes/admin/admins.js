const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { authenticateAdmin } = require('../../middleware/auth');
const ApiResponse = require('../../utils/response');
const { query } = require('../../config/database');

router.use(authenticateAdmin);

/** 管理员列表 */
router.get('/admins', async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(pageSize);

    const [{ total }] = await query('SELECT COUNT(*) as total FROM admins');

    const list = await query(
      `SELECT a.id, a.username, a.real_name, a.email, a.phone, a.avatar,
              a.role_id, a.status, a.last_login_at, a.created_at,
              r.name as role_name, r.display_name as role_display_name
       FROM admins a
       LEFT JOIN roles r ON a.role_id = r.id
       ORDER BY a.created_at ASC LIMIT ? OFFSET ?`,
      [parseInt(pageSize), offset]
    );

    ApiResponse.paginate(res, { list, total, page: parseInt(page), pageSize: parseInt(pageSize) });
  } catch (err) {
    ApiResponse.error(res, '获取管理员列表失败');
  }
});

/** 新增管理员 */
router.post('/admins', async (req, res) => {
  try {
    const { username, password, real_name, email, phone, role_id } = req.body;
    if (!username || !password) return ApiResponse.badRequest(res, '用户名和密码不能为空');

    const [existing] = await query('SELECT id FROM admins WHERE username = ?', [username]);
    if (existing) return ApiResponse.badRequest(res, '用户名已存在');

    const hashed = await bcrypt.hash(password, 10);
    await query(
      `INSERT INTO admins (username, password, real_name, email, phone, role_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [username, hashed, real_name || '', email || '', phone || '', role_id]
    );

    ApiResponse.created(res, null, '创建成功');
  } catch (err) {
    ApiResponse.error(res, '创建失败');
  }
});

/** 编辑管理员 */
router.put('/admins/:id', async (req, res) => {
  try {
    const { real_name, email, phone, role_id, status } = req.body;
    const [admin] = await query(
      `SELECT a.id, r.name as role_name FROM admins a
       LEFT JOIN roles r ON a.role_id = r.id WHERE a.id = ?`,
      [req.params.id]
    );
    if (!admin) return ApiResponse.notFound(res, '管理员不存在');
    if (admin.role_name === 'super_admin') {
      return ApiResponse.badRequest(res, '超级管理员不可编辑');
    }

    await query(
      `UPDATE admins SET real_name = ?, email = ?, phone = ?, role_id = ?, status = ? WHERE id = ?`,
      [real_name || '', email || '', phone || '', role_id, status !== undefined ? status : 1, req.params.id]
    );

    ApiResponse.success(res, null, '更新成功');
  } catch (err) {
    ApiResponse.error(res, '更新失败');
  }
});

/** 删除管理员 */
router.delete('/admins/:id', async (req, res) => {
  try {
    const targetId = parseInt(req.params.id);
    if (targetId === req.admin.id) return ApiResponse.badRequest(res, '不能删除自己');

    const [admin] = await query(
      `SELECT a.id, r.name as role_name FROM admins a
       LEFT JOIN roles r ON a.role_id = r.id WHERE a.id = ?`,
      [targetId]
    );
    if (!admin) return ApiResponse.notFound(res, '管理员不存在');
    if (admin.role_name === 'super_admin') return ApiResponse.badRequest(res, '不能删除超级管理员');

    await query('DELETE FROM admins WHERE id = ?', [targetId]);
    ApiResponse.success(res, null, '删除成功');
  } catch (err) {
    ApiResponse.error(res, '删除失败');
  }
});

module.exports = router;
