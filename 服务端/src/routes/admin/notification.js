const router = require('express').Router();
const { authenticateAdmin } = require('../../middleware/auth');
const ApiResponse = require('../../utils/response');
const { query } = require('../../config/database');

router.use(authenticateAdmin);

/** 通知列表(后台) */
router.get('/notification/list', async (req, res) => {
  try {
    const { userId, type, isRead, page = 1, pageSize = 20 } = req.query;
    const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(pageSize);
    const conditions = [];
    const params = [];

    if (userId) { conditions.push('n.user_id = ?'); params.push(userId); }
    if (type) { conditions.push('n.type = ?'); params.push(type); }
    if (isRead !== undefined && isRead !== '') { conditions.push('n.is_read = ?'); params.push(parseInt(isRead)); }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [{ total }] = await query(`SELECT COUNT(*) as total FROM notifications n ${where}`, params);

    const list = await query(
      `SELECT n.*, u.email as user_email, u.nickname as user_nickname
       FROM notifications n
       LEFT JOIN users u ON n.user_id = u.id
       ${where}
       ORDER BY n.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    );

    ApiResponse.paginate(res, { list, total, page: parseInt(page), pageSize: parseInt(pageSize) });
  } catch (err) {
    ApiResponse.error(res, '获取通知列表失败');
  }
});

/** 发送系统通知 */
router.post('/notification/send', async (req, res) => {
  try {
    const { userId, allUsers, title, content, type } = req.body;
    if (!title || !content) return ApiResponse.badRequest(res, '标题和内容不能为空');

    const msgType = type || 'system';

    if (allUsers) {
      const users = await query("SELECT id FROM users WHERE account_status = 'active'");
      const values = users.map(u => [u.id, msgType, title, content]);
      if (values.length > 0) {
        const placeholders = values.map(() => '(?, ?, ?, ?)').join(',');
        const flatParams = values.flat();
        await query(
          `INSERT INTO notifications (user_id, type, title, content) VALUES ${placeholders}`,
          flatParams
        );
      }
      ApiResponse.success(res, { sent: values.length }, `已发送给${values.length}个用户`);
    } else if (userId) {
      await query(
        'INSERT INTO notifications (user_id, type, title, content) VALUES (?, ?, ?, ?)',
        [userId, msgType, title, content]
      );
      ApiResponse.success(res, null, '发送成功');
    } else {
      ApiResponse.badRequest(res, '请指定用户或选择全部用户');
    }
  } catch (err) {
    ApiResponse.error(res, '发送失败');
  }
});

/** 公告列表(后台) */
router.get('/announcement/list', async (req, res) => {
  try {
    const { status, page = 1, pageSize = 20 } = req.query;
    const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(pageSize);
    const conditions = [];
    const params = [];

    if (status) { conditions.push('status = ?'); params.push(status); }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [{ total }] = await query(`SELECT COUNT(*) as total FROM announcements ${where}`, params);

    const list = await query(
      `SELECT * FROM announcements ${where}
       ORDER BY is_top DESC, created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    );

    ApiResponse.paginate(res, { list, total, page: parseInt(page), pageSize: parseInt(pageSize) });
  } catch (err) {
    ApiResponse.error(res, '获取公告列表失败');
  }
});

/** 创建公告 */
router.post('/announcement', async (req, res) => {
  try {
    const { title, content, cover_image, status, is_top } = req.body;
    if (!title || !content) return ApiResponse.badRequest(res, '标题和内容不能为空');

    const publishedAt = status === 'published' ? new Date() : null;

    const result = await query(
      `INSERT INTO announcements (title, content, cover_image, status, is_top, published_at, admin_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title, content, cover_image || '', status || 'draft', is_top ? 1 : 0, publishedAt, req.admin.id]
    );

    if (status === 'published') {
      const users = await query("SELECT id FROM users WHERE account_status = 'active'");
      if (users.length > 0) {
        const values = users.map(u => [u.id, 'announcement', title, content.substring(0, 200), 'announcement', result.insertId]);
        const placeholders = values.map(() => '(?, ?, ?, ?, ?, ?)').join(',');
        await query(`INSERT INTO notifications (user_id, type, title, content, ref_type, ref_id) VALUES ${placeholders}`, values.flat());
      }
    }

    ApiResponse.created(res, null, '创建成功');
  } catch (err) {
    ApiResponse.error(res, '创建失败');
  }
});

/** 编辑公告 */
router.put('/announcement/:id', async (req, res) => {
  try {
    const { title, content, cover_image, status, is_top } = req.body;
    const [existing] = await query('SELECT id, status as oldStatus FROM announcements WHERE id = ?', [req.params.id]);
    if (!existing) return ApiResponse.notFound(res, '公告不存在');

    const publishedAt = (status === 'published' && existing.oldStatus !== 'published') ? new Date() : undefined;

    const updates = ['title = ?', 'content = ?', 'cover_image = ?', 'status = ?', 'is_top = ?'];
    const params = [title, content, cover_image || '', status || 'draft', is_top ? 1 : 0];

    if (publishedAt) {
      updates.push('published_at = ?');
      params.push(publishedAt);
    }

    params.push(req.params.id);
    await query(`UPDATE announcements SET ${updates.join(', ')} WHERE id = ?`, params);

    if (status === 'published' && existing.oldStatus !== 'published') {
      const users = await query("SELECT id FROM users WHERE account_status = 'active'");
      if (users.length > 0) {
        const values = users.map(u => [u.id, 'announcement', title, (content || '').substring(0, 200), 'announcement', parseInt(req.params.id)]);
        const placeholders = values.map(() => '(?, ?, ?, ?, ?, ?)').join(',');
        await query(`INSERT INTO notifications (user_id, type, title, content, ref_type, ref_id) VALUES ${placeholders}`, values.flat());
      }
    }

    ApiResponse.success(res, null, '更新成功');
  } catch (err) {
    ApiResponse.error(res, '更新失败');
  }
});

/** 删除公告 */
router.delete('/announcement/:id', async (req, res) => {
  try {
    const result = await query('DELETE FROM announcements WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return ApiResponse.notFound(res, '公告不存在');
    ApiResponse.success(res, null, '删除成功');
  } catch (err) {
    ApiResponse.error(res, '删除失败');
  }
});

module.exports = router;
