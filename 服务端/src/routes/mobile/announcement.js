const router = require('express').Router();
const ApiResponse = require('../../utils/response');
const { query } = require('../../config/database');

/** 公告列表(仅显示已发布) */
router.get('/list', async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(pageSize);

    const [{ total }] = await query(
      "SELECT COUNT(*) as total FROM announcements WHERE status = 'published'"
    );

    const list = await query(
      `SELECT id, title, cover_image, is_top, published_at, view_count, created_at
       FROM announcements WHERE status = 'published'
       ORDER BY is_top DESC, published_at DESC LIMIT ? OFFSET ?`,
      [parseInt(pageSize), offset]
    );

    ApiResponse.paginate(res, { list, total, page: parseInt(page), pageSize: parseInt(pageSize) });
  } catch (err) {
    ApiResponse.error(res, '获取公告列表失败');
  }
});

/** 公告详情 */
router.get('/:id', async (req, res) => {
  try {
    const [item] = await query(
      "SELECT * FROM announcements WHERE id = ? AND status = 'published'",
      [req.params.id]
    );
    if (!item) return ApiResponse.notFound(res, '公告不存在');

    await query('UPDATE announcements SET view_count = view_count + 1 WHERE id = ?', [req.params.id]);
    item.view_count += 1;

    ApiResponse.success(res, item);
  } catch (err) {
    ApiResponse.error(res, '获取公告详情失败');
  }
});

module.exports = router;
