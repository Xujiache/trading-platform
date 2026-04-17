const { query, getConnection } = require('../config/database');

// ==================== Banner 管理 ====================

/** 获取 Banner 列表（管理端，含分页） */
async function getBanners({ page = 1, pageSize = 20, status, position }) {
  let sql = 'SELECT * FROM homepage_banners WHERE 1=1';
  const params = [];
  if (status) { sql += ' AND status = ?'; params.push(status); }
  if (position) { sql += ' AND position = ?'; params.push(position); }

  const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
  const [countRow] = await query(countSql, params);

  sql += ' ORDER BY sort_order ASC, id DESC LIMIT ? OFFSET ?';
  params.push(pageSize, (page - 1) * pageSize);
  const list = await query(sql, params);

  return { list, total: countRow.total, page, pageSize };
}

/** 获取前端可见的 Banner（有效状态 + 时间范围内） */
async function getActiveBanners(position = 'top') {
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const rows = await query(
    `SELECT id, title, image_url, link_type, link_value, position
     FROM homepage_banners
     WHERE status = 'active' AND position = ?
       AND (start_time IS NULL OR start_time <= ?)
       AND (end_time IS NULL OR end_time >= ?)
     ORDER BY sort_order ASC, id DESC`,
    [position, now, now]
  );
  return rows;
}

/** 创建 Banner */
async function createBanner(data) {
  const { title, image_url, link_type, link_value, position, status, sort_order, start_time, end_time, admin_id } = data;
  const result = await query(
    `INSERT INTO homepage_banners (title, image_url, link_type, link_value, position, status, sort_order, start_time, end_time, admin_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [title, image_url, link_type || 'none', link_value || '', position || 'top', status || 'active', sort_order || 0, start_time || null, end_time || null, admin_id]
  );
  return result;
}

/** 更新 Banner */
async function updateBanner(id, data) {
  const fields = [];
  const params = [];
  const allowedFields = ['title', 'image_url', 'link_type', 'link_value', 'position', 'status', 'sort_order', 'start_time', 'end_time'];
  for (const key of allowedFields) {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`);
      params.push(data[key]);
    }
  }
  if (fields.length === 0) return null;
  params.push(id);
  await query(`UPDATE homepage_banners SET ${fields.join(', ')} WHERE id = ?`, params);
  const [updated] = await query('SELECT * FROM homepage_banners WHERE id = ?', [id]);
  return updated;
}

/** 删除 Banner */
async function deleteBanner(id) {
  await query('DELETE FROM homepage_banners WHERE id = ?', [id]);
}

/** 记录 Banner 点击 */
async function clickBanner(id) {
  await query('UPDATE homepage_banners SET click_count = click_count + 1 WHERE id = ?', [id]);
}

// ==================== 奖励卡片管理 ====================

/** 获取奖励卡片列表（管理端，含分页） */
async function getRewardCards({ page = 1, pageSize = 20, status, reward_type }) {
  let sql = 'SELECT * FROM reward_cards WHERE 1=1';
  const params = [];
  if (status) { sql += ' AND status = ?'; params.push(status); }
  if (reward_type) { sql += ' AND reward_type = ?'; params.push(reward_type); }

  const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
  const [countRow] = await query(countSql, params);

  sql += ' ORDER BY sort_order ASC, id DESC LIMIT ? OFFSET ?';
  params.push(pageSize, (page - 1) * pageSize);
  const list = await query(sql, params);

  return { list, total: countRow.total, page, pageSize };
}

/** 获取前端可见的奖励卡片 */
async function getActiveRewardCards() {
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const rows = await query(
    `SELECT id, title, description, icon, reward_type, reward_amount, trigger_type, trigger_value, bg_color
     FROM reward_cards
     WHERE status = 'active'
       AND (start_time IS NULL OR start_time <= ?)
       AND (end_time IS NULL OR end_time >= ?)
     ORDER BY sort_order ASC, id DESC`,
    [now, now]
  );
  return rows;
}

/** 创建奖励卡片 */
async function createRewardCard(data) {
  const { title, description, icon, reward_type, reward_amount, trigger_type, trigger_value, bg_color, status, sort_order, start_time, end_time, admin_id } = data;
  const result = await query(
    `INSERT INTO reward_cards (title, description, icon, reward_type, reward_amount, trigger_type, trigger_value, bg_color, status, sort_order, start_time, end_time, admin_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [title, description || '', icon || '', reward_type || 'bonus', reward_amount || 0, trigger_type || 'register', trigger_value || 0, bg_color || '#1890FF', status || 'active', sort_order || 0, start_time || null, end_time || null, admin_id]
  );
  return result;
}

/** 更新奖励卡片 */
async function updateRewardCard(id, data) {
  const fields = [];
  const params = [];
  const allowedFields = ['title', 'description', 'icon', 'reward_type', 'reward_amount', 'trigger_type', 'trigger_value', 'bg_color', 'status', 'sort_order', 'start_time', 'end_time'];
  for (const key of allowedFields) {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`);
      params.push(data[key]);
    }
  }
  if (fields.length === 0) return null;
  params.push(id);
  await query(`UPDATE reward_cards SET ${fields.join(', ')} WHERE id = ?`, params);
  const [updated] = await query('SELECT * FROM reward_cards WHERE id = ?', [id]);
  return updated;
}

/** 删除奖励卡片 */
async function deleteRewardCard(id) {
  await query('DELETE FROM reward_cards WHERE id = ?', [id]);
}

// ==================== 活动管理 ====================

/** 获取活动列表（管理端，含分页） */
async function getActivities({ page = 1, pageSize = 20, status, activity_type, keyword }) {
  let sql = 'SELECT * FROM activities WHERE 1=1';
  const params = [];
  if (status) { sql += ' AND status = ?'; params.push(status); }
  if (activity_type) { sql += ' AND activity_type = ?'; params.push(activity_type); }
  if (keyword) { sql += ' AND (title LIKE ? OR summary LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`); }

  const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
  const [countRow] = await query(countSql, params);

  sql += ' ORDER BY is_top DESC, id DESC LIMIT ? OFFSET ?';
  params.push(pageSize, (page - 1) * pageSize);
  const list = await query(sql, params);

  return { list, total: countRow.total, page, pageSize };
}

/** 获取前端可见的活动列表 */
async function getPublicActivities({ page = 1, pageSize = 10 }) {
  const countSql = "SELECT COUNT(*) as total FROM activities WHERE status = 'active'";
  const [countRow] = await query(countSql);

  const list = await query(
    `SELECT id, title, summary, cover_image, activity_type, start_time, end_time,
            current_participants, max_participants, view_count, is_top
     FROM activities WHERE status = 'active'
     ORDER BY is_top DESC, id DESC LIMIT ? OFFSET ?`,
    [pageSize, (page - 1) * pageSize]
  );
  return { list, total: countRow.total, page, pageSize };
}

/** 获取活动详情 */
async function getActivityDetail(id) {
  const [row] = await query('SELECT * FROM activities WHERE id = ?', [id]);
  if (row) {
    await query('UPDATE activities SET view_count = view_count + 1 WHERE id = ?', [id]);
  }
  return row || null;
}

/** 创建活动 */
async function createActivity(data) {
  const { title, summary, content, cover_image, activity_type, status, start_time, end_time, rules, prize_desc, max_participants, is_top, admin_id } = data;
  const result = await query(
    `INSERT INTO activities (title, summary, content, cover_image, activity_type, status, start_time, end_time, rules, prize_desc, max_participants, is_top, admin_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [title, summary || '', content || '', cover_image || '', activity_type || 'promotion', status || 'draft', start_time || null, end_time || null, rules || '', prize_desc || '', max_participants || 0, is_top || 0, admin_id]
  );
  return result;
}

/** 更新活动 */
async function updateActivity(id, data) {
  const fields = [];
  const params = [];
  const allowedFields = ['title', 'summary', 'content', 'cover_image', 'activity_type', 'status', 'start_time', 'end_time', 'rules', 'prize_desc', 'max_participants', 'is_top'];
  for (const key of allowedFields) {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`);
      params.push(data[key]);
    }
  }
  if (fields.length === 0) return null;
  params.push(id);
  await query(`UPDATE activities SET ${fields.join(', ')} WHERE id = ?`, params);
  const [updated] = await query('SELECT * FROM activities WHERE id = ?', [id]);
  return updated;
}

/** 删除活动 */
async function deleteActivity(id) {
  await query('DELETE FROM activities WHERE id = ?', [id]);
}

/** 获取活动统计数据 */
async function getActivityStats() {
  const [total] = await query('SELECT COUNT(*) as cnt FROM activities');
  const [active] = await query("SELECT COUNT(*) as cnt FROM activities WHERE status = 'active'");
  const [draft] = await query("SELECT COUNT(*) as cnt FROM activities WHERE status = 'draft'");
  const [ended] = await query("SELECT COUNT(*) as cnt FROM activities WHERE status = 'ended'");
  const topActivities = await query(
    "SELECT id, title, view_count, current_participants FROM activities WHERE status = 'active' ORDER BY view_count DESC LIMIT 5"
  );
  return {
    total: total.cnt,
    active: active.cnt,
    draft: draft.cnt,
    ended: ended.cnt,
    topActivities,
  };
}

// ==================== 模拟盘费用配置 ====================

/** 获取模拟盘费用配置列表（全品种合并展示） */
async function getDemoFeeConfigs() {
  const allSymbols = await query(
    "SELECT id, symbol, name, category, fee_type, fee_value, spread_mode, spread_fixed, spread_min, spread_max, swap_long_rate, swap_short_rate, sort_order FROM trading_symbols WHERE status = 'active' ORDER BY sort_order ASC"
  );
  const customConfigs = await query('SELECT * FROM demo_fee_config');
  const configMap = {};
  customConfigs.forEach(c => { configMap[c.symbol] = c; });

  return allSymbols.map(s => {
    const custom = configMap[s.symbol];
    return {
      symbol_id: s.id,
      symbol: s.symbol,
      symbol_name: s.name,
      category: s.category,
      fee_type: custom ? custom.fee_type : s.fee_type,
      fee_value: custom ? custom.fee_value : s.fee_value,
      spread_mode: custom ? custom.spread_mode : s.spread_mode,
      spread_fixed: custom ? custom.spread_fixed : s.spread_fixed,
      spread_min: custom ? custom.spread_min : s.spread_min,
      spread_max: custom ? custom.spread_max : s.spread_max,
      swap_long_rate: custom ? custom.swap_long_rate : s.swap_long_rate,
      swap_short_rate: custom ? custom.swap_short_rate : s.swap_short_rate,
      is_custom: custom ? custom.is_custom : 0,
    };
  });
}

/** 获取某品种的模拟盘费用配置 */
async function getDemoFeeConfig(symbol) {
  const [row] = await query('SELECT * FROM demo_fee_config WHERE symbol = ?', [symbol]);
  return row || null;
}

/** 批量设置/更新模拟盘费用配置 */
async function upsertDemoFeeConfig(data) {
  const { symbol_id, symbol, fee_type, fee_value, spread_mode, spread_fixed, spread_min, spread_max, swap_long_rate, swap_short_rate, is_custom, admin_id } = data;
  await query(
    `INSERT INTO demo_fee_config (symbol_id, symbol, fee_type, fee_value, spread_mode, spread_fixed, spread_min, spread_max, swap_long_rate, swap_short_rate, is_custom, admin_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       fee_type = VALUES(fee_type), fee_value = VALUES(fee_value),
       spread_mode = VALUES(spread_mode), spread_fixed = VALUES(spread_fixed),
       spread_min = VALUES(spread_min), spread_max = VALUES(spread_max),
       swap_long_rate = VALUES(swap_long_rate), swap_short_rate = VALUES(swap_short_rate),
       is_custom = VALUES(is_custom), admin_id = VALUES(admin_id)`,
    [symbol_id, symbol, fee_type || 'per_lot', fee_value || 0, spread_mode || 'fixed', spread_fixed || 0, spread_min || 0, spread_max || 0, swap_long_rate || 0, swap_short_rate || 0, is_custom ?? 1, admin_id]
  );
}

/** 恢复某品种模拟盘费用为真实盘设置 */
async function resetDemoFeeToReal(symbol) {
  const [realConfig] = await query(
    'SELECT id, fee_type, fee_value, spread_mode, spread_fixed, spread_min, spread_max, swap_long_rate, swap_short_rate FROM trading_symbols WHERE symbol = ?',
    [symbol]
  );
  if (!realConfig) return null;

  await query(
    `UPDATE demo_fee_config SET fee_type = ?, fee_value = ?, spread_mode = ?, spread_fixed = ?, spread_min = ?, spread_max = ?, swap_long_rate = ?, swap_short_rate = ?, is_custom = 0 WHERE symbol = ?`,
    [realConfig.fee_type, realConfig.fee_value, realConfig.spread_mode, realConfig.spread_fixed, realConfig.spread_min, realConfig.spread_max, realConfig.swap_long_rate, realConfig.swap_short_rate, symbol]
  );
  return realConfig;
}

/** 将所有品种的真实盘配置同步到模拟盘 */
async function syncAllDemoFeeFromReal(adminId) {
  const symbols = await query("SELECT id, symbol, fee_type, fee_value, spread_mode, spread_fixed, spread_min, spread_max, swap_long_rate, swap_short_rate FROM trading_symbols WHERE status = 'active'");
  for (const s of symbols) {
    await upsertDemoFeeConfig({
      symbol_id: s.id, symbol: s.symbol,
      fee_type: s.fee_type, fee_value: s.fee_value,
      spread_mode: s.spread_mode, spread_fixed: s.spread_fixed,
      spread_min: s.spread_min, spread_max: s.spread_max,
      swap_long_rate: s.swap_long_rate, swap_short_rate: s.swap_short_rate,
      is_custom: 0, admin_id: adminId,
    });
  }
  return symbols.length;
}

// ==================== 第三方接口管理 ====================

/** 获取第三方接口列表 */
async function getIntegrations({ page = 1, pageSize = 20, type, status }) {
  let sql = 'SELECT id, name, type, provider, api_url, status, last_check_at, last_check_status, last_check_message, description, created_at FROM integrations WHERE 1=1';
  const params = [];
  if (type) { sql += ' AND type = ?'; params.push(type); }
  if (status) { sql += ' AND status = ?'; params.push(status); }

  const countSql = sql.replace(/SELECT .+ FROM/, 'SELECT COUNT(*) as total FROM');
  const [countRow] = await query(countSql, params);

  sql += ' ORDER BY id ASC LIMIT ? OFFSET ?';
  params.push(pageSize, (page - 1) * pageSize);
  const list = await query(sql, params);

  return { list, total: countRow.total, page, pageSize };
}

/** 获取接口详情（含敏感信息） */
async function getIntegrationDetail(id) {
  const [row] = await query('SELECT * FROM integrations WHERE id = ?', [id]);
  return row || null;
}

/** 创建第三方接口配置 */
async function createIntegration(data) {
  const { name, type, provider, api_url, api_key, api_secret, extra_config, status, description, admin_id } = data;
  const result = await query(
    `INSERT INTO integrations (name, type, provider, api_url, api_key, api_secret, extra_config, status, description, admin_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, type, provider || '', api_url || '', api_key || '', api_secret || '', extra_config ? JSON.stringify(extra_config) : null, status || 'active', description || '', admin_id]
  );
  return result;
}

/** 更新第三方接口配置 */
async function updateIntegration(id, data) {
  const fields = [];
  const params = [];
  const allowedFields = ['name', 'type', 'provider', 'api_url', 'api_key', 'api_secret', 'status', 'description'];
  for (const key of allowedFields) {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`);
      params.push(data[key]);
    }
  }
  if (data.extra_config !== undefined) {
    fields.push('extra_config = ?');
    params.push(JSON.stringify(data.extra_config));
  }
  if (fields.length === 0) return null;
  params.push(id);
  await query(`UPDATE integrations SET ${fields.join(', ')} WHERE id = ?`, params);
  const [updated] = await query('SELECT * FROM integrations WHERE id = ?', [id]);
  return updated;
}

/** 删除第三方接口配置 */
async function deleteIntegration(id) {
  await query('DELETE FROM integrations WHERE id = ?', [id]);
}

/** 检测接口连通性 */
async function checkIntegrationConnectivity(id) {
  const [integration] = await query('SELECT * FROM integrations WHERE id = ?', [id]);
  if (!integration) return null;

  let checkStatus = 'fail';
  let message = '';
  const startTime = Date.now();

  try {
    if (!integration.api_url) {
      message = '未配置接口地址';
    } else {
      const http = integration.api_url.startsWith('https') ? require('https') : require('http');
      await new Promise((resolve, reject) => {
        const req = http.get(integration.api_url, { timeout: 10000 }, (res) => {
          checkStatus = res.statusCode < 400 ? 'success' : 'fail';
          message = `HTTP ${res.statusCode}, 耗时 ${Date.now() - startTime}ms`;
          resolve();
        });
        req.on('error', (err) => {
          message = `连接失败: ${err.message}`;
          reject(err);
        });
        req.on('timeout', () => {
          message = '连接超时(10s)';
          req.destroy();
          reject(new Error('timeout'));
        });
      });
    }
  } catch (e) {
    checkStatus = 'fail';
    if (!message) message = e.message;
  }

  await query(
    'UPDATE integrations SET last_check_at = NOW(), last_check_status = ?, last_check_message = ? WHERE id = ?',
    [checkStatus, message, id]
  );

  return { status: checkStatus, message, duration: Date.now() - startTime };
}

// ==================== 首页聚合数据 ====================

/** 聚合首页所需数据（Banner + 奖励卡片） */
async function getHomepageAggregation() {
  const banners = await getActiveBanners('top');
  const middleBanners = await getActiveBanners('middle');
  const rewardCards = await getActiveRewardCards();
  return { banners, middleBanners, rewardCards };
}

module.exports = {
  getBanners, getActiveBanners, createBanner, updateBanner, deleteBanner, clickBanner,
  getRewardCards, getActiveRewardCards, createRewardCard, updateRewardCard, deleteRewardCard,
  getActivities, getPublicActivities, getActivityDetail, createActivity, updateActivity, deleteActivity, getActivityStats,
  getDemoFeeConfigs, getDemoFeeConfig, upsertDemoFeeConfig, resetDemoFeeToReal, syncAllDemoFeeFromReal,
  getIntegrations, getIntegrationDetail, createIntegration, updateIntegration, deleteIntegration, checkIntegrationConnectivity,
  getHomepageAggregation,
};
