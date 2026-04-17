const { body } = require('express-validator');
const { query } = require('../../config/database');
const emailService = require('../../services/emailService');
const ApiResponse = require('../../utils/response');

exports.list = async (req, res, next) => {
  try {
    const { category, keyword } = req.query;
    let where = 'WHERE 1=1';
    const params = [];

    if (category) {
      where += ' AND category = ?';
      params.push(category);
    }
    if (keyword) {
      where += ' AND (config_key LIKE ? OR label LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    const list = await query(
      `SELECT * FROM system_config ${where} ORDER BY category, sort_order, id`,
      params
    );
    ApiResponse.success(res, list);
  } catch (error) {
    next(error);
  }
};

exports.categories = async (req, res, next) => {
  try {
    const rows = await query('SELECT DISTINCT category FROM system_config ORDER BY category');
    ApiResponse.success(res, rows.map(r => r.category));
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { config_value } = req.body;

    const [cfg] = await query('SELECT * FROM system_config WHERE id = ?', [id]);
    if (!cfg) {
      return ApiResponse.notFound(res, '配置项不存在');
    }

    await query('UPDATE system_config SET config_value = ? WHERE id = ?', [config_value, id]);
    ApiResponse.success(res, null, '配置更新成功');
  } catch (error) {
    next(error);
  }
};

exports.batchUpdate = async (req, res, next) => {
  try {
    const { configs } = req.body;
    if (!Array.isArray(configs) || configs.length === 0) {
      return ApiResponse.badRequest(res, '请提供配置项');
    }

    for (const item of configs) {
      await query(
        'UPDATE system_config SET config_value = ? WHERE id = ?',
        [item.config_value, item.id]
      );
    }

    ApiResponse.success(res, null, '批量更新成功');
  } catch (error) {
    next(error);
  }
};

exports.getEmailConfig = async (req, res, next) => {
  try {
    const rows = await query(
      "SELECT * FROM system_config WHERE category = 'email' ORDER BY sort_order, id"
    );
    const config = {};
    rows.forEach(r => {
      config[r.config_key] = r.config_value;
    });
    ApiResponse.success(res, config);
  } catch (error) {
    next(error);
  }
};

exports.updateEmailConfig = async (req, res, next) => {
  try {
    const fields = req.body;
    for (const [key, value] of Object.entries(fields)) {
      await query(
        'UPDATE system_config SET config_value = ? WHERE config_key = ?',
        [String(value), key]
      );
    }
    ApiResponse.success(res, null, '邮箱配置更新成功');
  } catch (error) {
    next(error);
  }
};

exports.testEmailValidation = [
  body('to').isEmail().withMessage('请输入有效的测试邮箱'),
];

exports.testEmail = async (req, res, next) => {
  try {
    const { to } = req.body;
    const rows = await query("SELECT config_key, config_value FROM system_config WHERE category = 'email'");
    const smtpConfig = {};
    rows.forEach(r => {
      const shortKey = r.config_key.replace('smtp_', '');
      smtpConfig[shortKey] = r.config_value;
    });
    smtpConfig.secure = smtpConfig.secure === 'true';
    smtpConfig.port = parseInt(smtpConfig.port) || 465;
    smtpConfig.fromAddress = smtpConfig.from_address;
    smtpConfig.fromName = smtpConfig.from_name;

    await emailService.sendTestEmail(to, smtpConfig);
    ApiResponse.success(res, null, '测试邮件发送成功');
  } catch (error) {
    next(error);
  }
};
