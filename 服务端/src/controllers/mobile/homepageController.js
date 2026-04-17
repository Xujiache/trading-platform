const { query } = require('../../config/database');
const ApiResponse = require('../../utils/response');

exports.getSplashAd = async (req, res, next) => {
  try {
    const rows = await query(
      "SELECT config_key, config_value FROM system_config WHERE config_key LIKE 'splash_%'"
    );
    const config = {};
    rows.forEach(r => {
      const key = r.config_key.replace('splash_', '');
      config[key] = r.config_value;
    });

    ApiResponse.success(res, {
      enabled: config.enabled === 'true',
      imageUrl: config.image_url || '',
      linkUrl: config.link_url || '',
      duration: parseInt(config.duration) || 3,
      richText: config.rich_text || '',
    });
  } catch (error) {
    next(error);
  }
};

exports.getContent = async (req, res, next) => {
  try {
    const { key } = req.params;
    const validKeys = ['about_us', 'user_agreement', 'privacy_policy', 'risk_warning'];
    if (!validKeys.includes(key)) {
      return ApiResponse.notFound(res, '内容不存在');
    }

    const [config] = await query(
      'SELECT config_value FROM system_config WHERE config_key = ?',
      [key]
    );

    ApiResponse.success(res, {
      key,
      content: config ? config.config_value : '',
    });
  } catch (error) {
    next(error);
  }
};
