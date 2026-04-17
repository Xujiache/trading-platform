const router = require('express').Router();
const ApiResponse = require('../../utils/response');
const { query } = require('../../config/database');

/** 帮助文档列表(按分类筛选) */
router.get('/list', async (req, res) => {
  try {
    const { category } = req.query;
    const conditions = ["status = 'published'"];
    const params = [];

    if (category) { conditions.push('category = ?'); params.push(category); }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const list = await query(
      `SELECT id, title, category, sort_order, view_count, created_at
       FROM help_docs ${where}
       ORDER BY sort_order ASC, created_at DESC`,
      params
    );

    ApiResponse.success(res, list);
  } catch (err) {
    ApiResponse.error(res, '获取帮助列表失败');
  }
});

/** 搜索帮助文档 */
router.get('/search', async (req, res) => {
  try {
    const { keyword } = req.query;
    if (!keyword) return ApiResponse.badRequest(res, '请输入搜索关键词');

    const list = await query(
      `SELECT id, title, category, view_count, created_at
       FROM help_docs
       WHERE status = 'published' AND (title LIKE ? OR content LIKE ?)
       ORDER BY sort_order ASC LIMIT 50`,
      [`%${keyword}%`, `%${keyword}%`]
    );

    ApiResponse.success(res, list);
  } catch (err) {
    ApiResponse.error(res, '搜索失败');
  }
});

/** 帮助文档详情 */
router.get('/:id', async (req, res) => {
  try {
    const [doc] = await query(
      "SELECT * FROM help_docs WHERE id = ? AND status = 'published'",
      [req.params.id]
    );
    if (!doc) return ApiResponse.notFound(res, '文档不存在');

    await query('UPDATE help_docs SET view_count = view_count + 1 WHERE id = ?', [req.params.id]);
    doc.view_count += 1;

    ApiResponse.success(res, doc);
  } catch (err) {
    ApiResponse.error(res, '获取详情失败');
  }
});

module.exports = router;
