const router = require('express').Router();
const { authenticateToken } = require('../../middleware/auth');
const ApiResponse = require('../../utils/response');
const { query } = require('../../config/database');

router.use(authenticateToken);

/** 消息列表(支持分类筛选) */
router.get('/list', async (req, res) => {
  try {
    const { type, page = 1, pageSize = 20 } = req.query;
    const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(pageSize);
    const conditions = ['user_id = ?'];
    const params = [req.user.id];

    if (type) { conditions.push('type = ?'); params.push(type); }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const [{ total }] = await query(`SELECT COUNT(*) as total FROM notifications ${where}`, params);

    const list = await query(
      `SELECT id, type, title, content, ref_type, ref_id, is_read, created_at
       FROM notifications ${where}
       ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    );

    ApiResponse.paginate(res, { list, total, page: parseInt(page), pageSize: parseInt(pageSize) });
  } catch (err) {
    ApiResponse.error(res, '获取消息列表失败');
  }
});

/** 获取未读数量(总数+各分类) */
router.get('/unread-count', async (req, res) => {
  try {
    const rows = await query(
      `SELECT type, COUNT(*) as count FROM notifications
       WHERE user_id = ? AND is_read = 0 GROUP BY type`,
      [req.user.id]
    );

    const counts = { total: 0, system: 0, trade: 0, fund: 0, announcement: 0 };
    rows.forEach(r => {
      counts[r.type] = r.count;
      counts.total += r.count;
    });

    ApiResponse.success(res, counts);
  } catch (err) {
    ApiResponse.error(res, '查询失败');
  }
});

/** 标记单条已读 */
router.post('/:id/read', async (req, res) => {
  try {
    await query(
      'UPDATE notifications SET is_read = 1, read_at = NOW() WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    ApiResponse.success(res, null, '已标记已读');
  } catch (err) {
    ApiResponse.error(res, '操作失败');
  }
});

/** 全部标记已读 */
router.post('/read-all', async (req, res) => {
  try {
    await query(
      'UPDATE notifications SET is_read = 1, read_at = NOW() WHERE user_id = ? AND is_read = 0',
      [req.user.id]
    );
    ApiResponse.success(res, null, '已全部标记已读');
  } catch (err) {
    ApiResponse.error(res, '操作失败');
  }
});

module.exports = router;
