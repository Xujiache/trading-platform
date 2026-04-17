const router = require('express').Router();
const { authenticateToken } = require('../../middleware/auth');
const ApiResponse = require('../../utils/response');
const { query } = require('../../config/database');

router.use(authenticateToken);

/** 获取或创建会话 */
router.get('/conversation', async (req, res) => {
  try {
    const [existing] = await query(
      "SELECT * FROM chat_conversations WHERE user_id = ? AND status IN ('waiting','active') ORDER BY created_at DESC LIMIT 1",
      [req.user.id]
    );

    if (existing) return ApiResponse.success(res, existing);

    const result = await query(
      "INSERT INTO chat_conversations (user_id, status) VALUES (?, 'waiting')",
      [req.user.id]
    );

    const [conv] = await query('SELECT * FROM chat_conversations WHERE id = ?', [result.insertId]);
    ApiResponse.success(res, conv);
  } catch (err) {
    ApiResponse.error(res, '获取会话失败');
  }
});

/** 消息列表 */
router.get('/messages', async (req, res) => {
  try {
    const { conversation_id, page = 1, pageSize = 50 } = req.query;
    if (!conversation_id) return ApiResponse.badRequest(res, '缺少会话ID');

    const [conv] = await query(
      'SELECT id FROM chat_conversations WHERE id = ? AND user_id = ?',
      [conversation_id, req.user.id]
    );
    if (!conv) return ApiResponse.notFound(res, '会话不存在');

    const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(pageSize);

    const [{ total }] = await query(
      'SELECT COUNT(*) as total FROM chat_messages WHERE conversation_id = ?',
      [conversation_id]
    );

    const messages = await query(
      `SELECT id, sender_type, sender_id, content, msg_type, is_read, created_at
       FROM chat_messages WHERE conversation_id = ?
       ORDER BY created_at ASC LIMIT ? OFFSET ?`,
      [conversation_id, parseInt(pageSize), offset]
    );

    await query(
      "UPDATE chat_messages SET is_read = 1 WHERE conversation_id = ? AND sender_type = 'admin' AND is_read = 0",
      [conversation_id]
    );
    await query(
      'UPDATE chat_conversations SET user_unread = 0 WHERE id = ?', [conversation_id]
    );

    ApiResponse.paginate(res, { list: messages, total, page: parseInt(page), pageSize: parseInt(pageSize) });
  } catch (err) {
    ApiResponse.error(res, '获取消息失败');
  }
});

/** 发送消息 */
router.post('/send', async (req, res) => {
  try {
    const { conversation_id, content, msg_type } = req.body;
    if (!conversation_id || !content) return ApiResponse.badRequest(res, '缺少必要参数');

    const [conv] = await query(
      "SELECT id, status FROM chat_conversations WHERE id = ? AND user_id = ?",
      [conversation_id, req.user.id]
    );
    if (!conv) return ApiResponse.notFound(res, '会话不存在');
    if (conv.status === 'closed') return ApiResponse.badRequest(res, '会话已关闭');

    await query(
      `INSERT INTO chat_messages (conversation_id, sender_type, sender_id, content, msg_type)
       VALUES (?, 'user', ?, ?, ?)`,
      [conversation_id, req.user.id, content, msg_type || 'text']
    );

    await query(
      `UPDATE chat_conversations SET last_message = ?, last_message_at = NOW(),
       admin_unread = admin_unread + 1 WHERE id = ?`,
      [content.substring(0, 200), conversation_id]
    );

    ApiResponse.success(res, null, '发送成功');
  } catch (err) {
    ApiResponse.error(res, '发送失败');
  }
});

/** 未读消息数 */
router.get('/unread', async (req, res) => {
  try {
    const [result] = await query(
      "SELECT COALESCE(SUM(user_unread), 0) as count FROM chat_conversations WHERE user_id = ? AND status != 'closed'",
      [req.user.id]
    );
    ApiResponse.success(res, { count: result.count });
  } catch (err) {
    ApiResponse.error(res, '查询失败');
  }
});

module.exports = router;
