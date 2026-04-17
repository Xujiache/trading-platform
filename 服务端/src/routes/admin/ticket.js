const router = require('express').Router();
const { authenticateAdmin } = require('../../middleware/auth');
const ApiResponse = require('../../utils/response');
const { query } = require('../../config/database');

router.use(authenticateAdmin);

/** 工单列表(后台) */
router.get('/ticket/list', async (req, res) => {
  try {
    const { status, category, userId, page = 1, pageSize = 20 } = req.query;
    const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(pageSize);
    const conditions = [];
    const params = [];

    if (status) { conditions.push('t.status = ?'); params.push(status); }
    if (category) { conditions.push('t.category = ?'); params.push(category); }
    if (userId) { conditions.push('t.user_id = ?'); params.push(userId); }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [{ total }] = await query(`SELECT COUNT(*) as total FROM tickets t ${where}`, params);

    const list = await query(
      `SELECT t.*, u.email as user_email, u.nickname as user_nickname
       FROM tickets t
       LEFT JOIN users u ON t.user_id = u.id
       ${where}
       ORDER BY t.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    );

    ApiResponse.paginate(res, { list, total, page: parseInt(page), pageSize: parseInt(pageSize) });
  } catch (err) {
    ApiResponse.error(res, '获取工单列表失败');
  }
});

/** 工单详情(后台) */
router.get('/ticket/:id', async (req, res) => {
  try {
    const [ticket] = await query(
      `SELECT t.*, u.email as user_email, u.nickname as user_nickname
       FROM tickets t LEFT JOIN users u ON t.user_id = u.id
       WHERE t.id = ?`,
      [req.params.id]
    );
    if (!ticket) return ApiResponse.notFound(res, '工单不存在');
    ApiResponse.success(res, ticket);
  } catch (err) {
    ApiResponse.error(res, '获取详情失败');
  }
});

/** 回复工单 */
router.post('/ticket/:id/reply', async (req, res) => {
  try {
    const { reply_content } = req.body;
    if (!reply_content) return ApiResponse.badRequest(res, '回复内容不能为空');

    const [ticket] = await query('SELECT status FROM tickets WHERE id = ?', [req.params.id]);
    if (!ticket) return ApiResponse.notFound(res, '工单不存在');
    if (ticket.status === 'closed') return ApiResponse.badRequest(res, '工单已关闭');

    await query(
      `UPDATE tickets SET reply_content = ?, replied_at = NOW(), status = 'processing',
       assigned_to = ? WHERE id = ?`,
      [reply_content, req.admin.id, req.params.id]
    );

    ApiResponse.success(res, null, '回复成功');
  } catch (err) {
    ApiResponse.error(res, '回复失败');
  }
});

/** 标记工单已解决 */
router.put('/ticket/:id/resolve', async (req, res) => {
  try {
    const [ticket] = await query('SELECT status FROM tickets WHERE id = ?', [req.params.id]);
    if (!ticket) return ApiResponse.notFound(res, '工单不存在');
    if (ticket.status === 'closed') return ApiResponse.badRequest(res, '工单已关闭');

    await query(
      "UPDATE tickets SET status = 'resolved' WHERE id = ?",
      [req.params.id]
    );

    ApiResponse.success(res, null, '工单已标记为已解决');
  } catch (err) {
    ApiResponse.error(res, '操作失败');
  }
});

/** 关闭工单 */
router.put('/ticket/:id/close', async (req, res) => {
  try {
    const [ticket] = await query('SELECT status FROM tickets WHERE id = ?', [req.params.id]);
    if (!ticket) return ApiResponse.notFound(res, '工单不存在');
    if (ticket.status === 'closed') return ApiResponse.badRequest(res, '工单已关闭');

    await query(
      "UPDATE tickets SET status = 'closed', closed_at = NOW() WHERE id = ?",
      [req.params.id]
    );

    ApiResponse.success(res, null, '工单已关闭');
  } catch (err) {
    ApiResponse.error(res, '关闭失败');
  }
});

/** 帮助文档列表(后台) */
router.get('/help/list', async (req, res) => {
  try {
    const { category, status, page = 1, pageSize = 20 } = req.query;
    const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(pageSize);
    const conditions = [];
    const params = [];

    if (category) { conditions.push('category = ?'); params.push(category); }
    if (status) { conditions.push('status = ?'); params.push(status); }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [{ total }] = await query(`SELECT COUNT(*) as total FROM help_docs ${where}`, params);

    const list = await query(
      `SELECT * FROM help_docs ${where}
       ORDER BY sort_order ASC, created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    );

    ApiResponse.paginate(res, { list, total, page: parseInt(page), pageSize: parseInt(pageSize) });
  } catch (err) {
    ApiResponse.error(res, '获取帮助列表失败');
  }
});

/** 创建帮助文档 */
router.post('/help', async (req, res) => {
  try {
    const { title, content, category, status, sort_order } = req.body;
    if (!title || !content) return ApiResponse.badRequest(res, '标题和内容不能为空');

    await query(
      `INSERT INTO help_docs (title, content, category, status, sort_order, admin_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title, content, category || 'faq', status || 'published', sort_order || 0, req.admin.id]
    );

    ApiResponse.created(res, null, '创建成功');
  } catch (err) {
    ApiResponse.error(res, '创建失败');
  }
});

/** 编辑帮助文档 */
router.put('/help/:id', async (req, res) => {
  try {
    const { title, content, category, status, sort_order } = req.body;
    const [existing] = await query('SELECT id FROM help_docs WHERE id = ?', [req.params.id]);
    if (!existing) return ApiResponse.notFound(res, '文档不存在');

    await query(
      `UPDATE help_docs SET title = ?, content = ?, category = ?, status = ?, sort_order = ? WHERE id = ?`,
      [title, content, category, status, sort_order || 0, req.params.id]
    );

    ApiResponse.success(res, null, '更新成功');
  } catch (err) {
    ApiResponse.error(res, '更新失败');
  }
});

/** 删除帮助文档 */
router.delete('/help/:id', async (req, res) => {
  try {
    const result = await query('DELETE FROM help_docs WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return ApiResponse.notFound(res, '文档不存在');
    ApiResponse.success(res, null, '删除成功');
  } catch (err) {
    ApiResponse.error(res, '删除失败');
  }
});

module.exports = router;
