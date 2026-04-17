const router = require('express').Router();
const { authenticateToken } = require('../../middleware/auth');
const ApiResponse = require('../../utils/response');
const { query } = require('../../config/database');

router.use(authenticateToken);

/** 创建工单 */
router.post('/', async (req, res) => {
  try {
    const { category, title, content, images } = req.body;
    if (!title || !content) return ApiResponse.badRequest(res, '标题和描述不能为空');

    const ticketNo = 'TK' + Date.now() + String(Math.floor(Math.random() * 10000)).padStart(4, '0');

    await query(
      `INSERT INTO tickets (ticket_no, user_id, category, title, content, images)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [ticketNo, req.user.id, category || 'other', title, content, images ? JSON.stringify(images) : null]
    );

    ApiResponse.created(res, { ticket_no: ticketNo }, '工单创建成功');
  } catch (err) {
    ApiResponse.error(res, '创建失败');
  }
});

/** 工单列表 */
router.get('/list', async (req, res) => {
  try {
    const { status, page = 1, pageSize = 20 } = req.query;
    const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(pageSize);
    const conditions = ['user_id = ?'];
    const params = [req.user.id];

    if (status) { conditions.push('status = ?'); params.push(status); }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const [{ total }] = await query(`SELECT COUNT(*) as total FROM tickets ${where}`, params);

    const list = await query(
      `SELECT id, ticket_no, category, title, status, priority, created_at, replied_at
       FROM tickets ${where}
       ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    );

    ApiResponse.paginate(res, { list, total, page: parseInt(page), pageSize: parseInt(pageSize) });
  } catch (err) {
    ApiResponse.error(res, '获取工单列表失败');
  }
});

/** 工单详情 */
router.get('/:id', async (req, res) => {
  try {
    const [ticket] = await query(
      'SELECT * FROM tickets WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!ticket) return ApiResponse.notFound(res, '工单不存在');
    ApiResponse.success(res, ticket);
  } catch (err) {
    ApiResponse.error(res, '获取详情失败');
  }
});

module.exports = router;
