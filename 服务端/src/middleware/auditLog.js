const { query } = require('../config/database');

function auditLog(module, action, options = {}) {
  return async (req, res, next) => {
    const startTime = Date.now();
    const originalJson = res.json.bind(res);

    res.json = function (body) {
      const admin = req.admin;
      const operatorType = admin ? 'admin' : 'system';
      const operatorId = admin?.id || null;
      const operatorName = admin?.username || admin?.real_name || 'system';
      const status = res.statusCode >= 200 && res.statusCode < 400 ? 'success' : 'fail';
      const durationMs = Date.now() - startTime;

      const ip = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || '';
      const userAgent = req.headers['user-agent'] || '';

      const targetType = options.targetType || '';
      const targetId = options.getTargetId ? options.getTargetId(req) : (req.params.id || '');

      const content = JSON.stringify({
        method: req.method,
        path: req.originalUrl,
        params: req.body || req.query,
        response: body?.code != null ? { code: body.code, msg: body.msg } : undefined,
      });

      const errorMessage = status === 'fail' ? (body?.msg || '') : null;

      query(
        `INSERT INTO audit_logs (operator_type, operator_id, operator_name, module, action,
         target_type, target_id, content, ip, user_agent, status, error_message, duration_ms)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [operatorType, operatorId, operatorName, module, action,
         targetType, String(targetId), content, ip, userAgent, status, errorMessage, durationMs]
      ).catch(err => console.error('[AuditLog] 写入失败:', err.message));

      return originalJson(body);
    };

    next();
  };
}

async function writeAuditLog({ operatorType = 'system', operatorId = null, operatorName = 'system',
  module, action, targetType = '', targetId = '', content = '', ip = '', userAgent = '',
  status = 'success', errorMessage = null, durationMs = null, beforeData = null, afterData = null }) {
  try {
    await query(
      `INSERT INTO audit_logs (operator_type, operator_id, operator_name, module, action,
       target_type, target_id, content, before_data, after_data, ip, user_agent, status, error_message, duration_ms)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [operatorType, operatorId, operatorName, module, action,
       targetType, String(targetId), typeof content === 'object' ? JSON.stringify(content) : content,
       beforeData ? JSON.stringify(beforeData) : null,
       afterData ? JSON.stringify(afterData) : null,
       ip, userAgent, status, errorMessage, durationMs]
    );
  } catch (err) {
    console.error('[AuditLog] 直接写入失败:', err.message);
  }
}

module.exports = { auditLog, writeAuditLog };
