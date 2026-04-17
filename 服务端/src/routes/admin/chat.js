const router = require('express').Router();
const { authenticateAdmin } = require('../../middleware/auth');
const ApiResponse = require('../../utils/response');
const { query } = require('../../config/database');

router.use(authenticateAdmin);

/** 会话列表 */
router.get('/chat/conversations', async (req, res) => {
  try {
    const { status, page = 1, pageSize = 20 } = req.query;
    const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(pageSize);
    const conditions = [];
    const params = [];

    if (status) { conditions.push('c.status = ?'); params.push(status); }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [{ total }] = await query(`SELECT COUNT(*) as total FROM chat_conversations c ${where}`, params);

    const list = await query(
      `SELECT c.*, u.email as user_email, u.nickname as user_nickname,
              a.username as admin_username, a.real_name as admin_real_name
       FROM chat_conversations c
       LEFT JOIN users u ON c.user_id = u.id
       LEFT JOIN admins a ON c.admin_id = a.id
       ${where}
       ORDER BY c.last_message_at DESC, c.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    );

    ApiResponse.paginate(res, { list, total, page: parseInt(page), pageSize: parseInt(pageSize) });
  } catch (err) {
    ApiResponse.error(res, '获取会话列表失败');
  }
});

/** 指定会话消息列表 */
router.get('/chat/messages/:id', async (req, res) => {
  try {
    const { page = 1, pageSize = 50 } = req.query;
    const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(pageSize);

    const [{ total }] = await query(
      'SELECT COUNT(*) as total FROM chat_messages WHERE conversation_id = ?',
      [req.params.id]
    );

    const messages = await query(
      `SELECT * FROM chat_messages WHERE conversation_id = ?
       ORDER BY created_at ASC LIMIT ? OFFSET ?`,
      [req.params.id, parseInt(pageSize), offset]
    );

    await query(
      "UPDATE chat_messages SET is_read = 1 WHERE conversation_id = ? AND sender_type = 'user' AND is_read = 0",
      [req.params.id]
    );
    await query('UPDATE chat_conversations SET admin_unread = 0 WHERE id = ?', [req.params.id]);

    ApiResponse.paginate(res, { list: messages, total, page: parseInt(page), pageSize: parseInt(pageSize) });
  } catch (err) {
    ApiResponse.error(res, '获取消息失败');
  }
});

/** 管理员发送消息 */
router.post('/chat/send', async (req, res) => {
  try {
    const { conversation_id, content, msg_type } = req.body;
    if (!conversation_id || !content) return ApiResponse.badRequest(res, '缺少必要参数');

    const [conv] = await query('SELECT status FROM chat_conversations WHERE id = ?', [conversation_id]);
    if (!conv) return ApiResponse.notFound(res, '会话不存在');
    if (conv.status === 'closed') return ApiResponse.badRequest(res, '会话已关闭');

    await query(
      `INSERT INTO chat_messages (conversation_id, sender_type, sender_id, content, msg_type)
       VALUES (?, 'admin', ?, ?, ?)`,
      [conversation_id, req.admin.id, content, msg_type || 'text']
    );

    await query(
      `UPDATE chat_conversations SET last_message = ?, last_message_at = NOW(),
       user_unread = user_unread + 1 WHERE id = ?`,
      [content.substring(0, 200), conversation_id]
    );

    ApiResponse.success(res, null, '发送成功');
  } catch (err) {
    ApiResponse.error(res, '发送失败');
  }
});

/** 接入会话 */
router.post('/chat/assign', async (req, res) => {
  try {
    const { conversation_id } = req.body;
    const [conv] = await query('SELECT status FROM chat_conversations WHERE id = ?', [conversation_id]);
    if (!conv) return ApiResponse.notFound(res, '会话不存在');
    if (conv.status === 'active') return ApiResponse.badRequest(res, '会话已被接入');
    if (conv.status === 'closed') return ApiResponse.badRequest(res, '会话已关闭');

    await query(
      "UPDATE chat_conversations SET admin_id = ?, status = 'active' WHERE id = ?",
      [req.admin.id, conversation_id]
    );

    await query(
      `INSERT INTO chat_messages (conversation_id, sender_type, sender_id, content)
       VALUES (?, 'system', ?, '客服已接入会话')`,
      [conversation_id, req.admin.id]
    );

    ApiResponse.success(res, null, '已接入');
  } catch (err) {
    ApiResponse.error(res, '接入失败');
  }
});

/** 关闭会话 */
router.post('/chat/close', async (req, res) => {
  try {
    const { conversation_id } = req.body;
    const [conv] = await query('SELECT status FROM chat_conversations WHERE id = ?', [conversation_id]);
    if (!conv) return ApiResponse.notFound(res, '会话不存在');
    if (conv.status === 'closed') return ApiResponse.badRequest(res, '会话已关闭');

    await query(
      "UPDATE chat_conversations SET status = 'closed', closed_at = NOW(), closed_by = 'admin' WHERE id = ?",
      [conversation_id]
    );

    await query(
      `INSERT INTO chat_messages (conversation_id, sender_type, sender_id, content)
       VALUES (?, 'system', ?, '客服已关闭会话')`,
      [conversation_id, req.admin.id]
    );

    ApiResponse.success(res, null, '会话已关闭');
  } catch (err) {
    ApiResponse.error(res, '关闭失败');
  }
});

/** 管理员未读总数 */
router.get('/chat/unread', async (req, res) => {
  try {
    const [result] = await query(
      `SELECT COALESCE(SUM(admin_unread), 0) as count
       FROM chat_conversations
       WHERE (admin_id = ? OR admin_id IS NULL) AND status != 'closed'`,
      [req.admin.id]
    );
    ApiResponse.success(res, { count: result.count });
  } catch (err) {
    ApiResponse.error(res, '查询失败');
  }
});

module.exports = router;
