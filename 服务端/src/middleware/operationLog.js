const { query } = require('../config/database');

function logOperation(module, action) {
  return async (req, res, next) => {
    const originalSend = res.json.bind(res);
    res.json = function (body) {
      const admin = req.admin;
      if (admin && admin.id) {
        const status = res.statusCode >= 200 && res.statusCode < 400 ? 'success' : 'fail';
        const content = JSON.stringify({
          params: req.body || req.query,
          response: body && body.code ? { code: body.code, msg: body.msg } : undefined,
        });
        const ip = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || '';
        const userAgent = req.headers['user-agent'] || '';

        query(
          `INSERT INTO operation_logs (admin_id, admin_username, module, action, content, ip, user_agent, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [admin.id, admin.username || '', module, action, content, ip, userAgent, status]
        ).catch(err => console.error('[OperationLog] 写入失败:', err.message));
      }
      return originalSend(body);
    };
    next();
  };
}

module.exports = { logOperation };
