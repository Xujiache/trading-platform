const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const { authenticateAdmin } = require('../../middleware/auth');
const ApiResponse = require('../../utils/response');
const operationService = require('../../services/operationService');

router.use(authenticateAdmin);

// ==================== Banner 管理 ====================

/** Banner 列表 */
router.get('/banners', async (req, res) => {
  try {
    const { page, pageSize, status, position } = req.query;
    const result = await operationService.getBanners({
      page: parseInt(page) || 1,
      pageSize: parseInt(pageSize) || 20,
      status, position,
    });
    ApiResponse.paginate(res, result);
  } catch (err) {
    ApiResponse.error(res, '获取Banner列表失败');
  }
});

/** 创建 Banner */
router.post('/banners', [
  body('title').notEmpty().withMessage('标题不能为空'),
  body('image_url').notEmpty().withMessage('图片不能为空'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return ApiResponse.badRequest(res, errors.array()[0].msg);
  try {
    await operationService.createBanner({ ...req.body, admin_id: req.admin.id });
    ApiResponse.success(res, null, '创建成功');
  } catch (err) {
    ApiResponse.error(res, '创建Banner失败');
  }
});

/** 更新 Banner */
router.put('/banners/:id', async (req, res) => {
  try {
    const updated = await operationService.updateBanner(req.params.id, req.body);
    if (!updated) return ApiResponse.notFound(res, 'Banner不存在');
    ApiResponse.success(res, updated, '更新成功');
  } catch (err) {
    ApiResponse.error(res, '更新Banner失败');
  }
});

/** 删除 Banner */
router.delete('/banners/:id', async (req, res) => {
  try {
    await operationService.deleteBanner(req.params.id);
    ApiResponse.success(res, null, '删除成功');
  } catch (err) {
    ApiResponse.error(res, '删除Banner失败');
  }
});

// ==================== 奖励卡片管理 ====================

/** 奖励卡片列表 */
router.get('/reward-cards', async (req, res) => {
  try {
    const { page, pageSize, status, reward_type } = req.query;
    const result = await operationService.getRewardCards({
      page: parseInt(page) || 1,
      pageSize: parseInt(pageSize) || 20,
      status, reward_type,
    });
    ApiResponse.paginate(res, result);
  } catch (err) {
    ApiResponse.error(res, '获取奖励卡片列表失败');
  }
});

/** 创建奖励卡片 */
router.post('/reward-cards', [
  body('title').notEmpty().withMessage('标题不能为空'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return ApiResponse.badRequest(res, errors.array()[0].msg);
  try {
    await operationService.createRewardCard({ ...req.body, admin_id: req.admin.id });
    ApiResponse.success(res, null, '创建成功');
  } catch (err) {
    ApiResponse.error(res, '创建奖励卡片失败');
  }
});

/** 更新奖励卡片 */
router.put('/reward-cards/:id', async (req, res) => {
  try {
    const updated = await operationService.updateRewardCard(req.params.id, req.body);
    if (!updated) return ApiResponse.notFound(res, '奖励卡片不存在');
    ApiResponse.success(res, updated, '更新成功');
  } catch (err) {
    ApiResponse.error(res, '更新奖励卡片失败');
  }
});

/** 删除奖励卡片 */
router.delete('/reward-cards/:id', async (req, res) => {
  try {
    await operationService.deleteRewardCard(req.params.id);
    ApiResponse.success(res, null, '删除成功');
  } catch (err) {
    ApiResponse.error(res, '删除奖励卡片失败');
  }
});

// ==================== 活动管理 ====================

/** 活动列表 */
router.get('/activities', async (req, res) => {
  try {
    const { page, pageSize, status, activity_type, keyword } = req.query;
    const result = await operationService.getActivities({
      page: parseInt(page) || 1,
      pageSize: parseInt(pageSize) || 20,
      status, activity_type, keyword,
    });
    ApiResponse.paginate(res, result);
  } catch (err) {
    ApiResponse.error(res, '获取活动列表失败');
  }
});

/** 活动详情 */
router.get('/activities/:id', async (req, res) => {
  try {
    const detail = await operationService.getActivityDetail(req.params.id);
    if (!detail) return ApiResponse.notFound(res, '活动不存在');
    ApiResponse.success(res, detail);
  } catch (err) {
    ApiResponse.error(res, '获取活动详情失败');
  }
});

/** 活动统计 */
router.get('/activity-stats', async (req, res) => {
  try {
    const stats = await operationService.getActivityStats();
    ApiResponse.success(res, stats);
  } catch (err) {
    ApiResponse.error(res, '获取活动统计失败');
  }
});

/** 创建活动 */
router.post('/activities', [
  body('title').notEmpty().withMessage('标题不能为空'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return ApiResponse.badRequest(res, errors.array()[0].msg);
  try {
    await operationService.createActivity({ ...req.body, admin_id: req.admin.id });
    ApiResponse.success(res, null, '创建成功');
  } catch (err) {
    ApiResponse.error(res, '创建活动失败');
  }
});

/** 更新活动 */
router.put('/activities/:id', async (req, res) => {
  try {
    const updated = await operationService.updateActivity(req.params.id, req.body);
    if (!updated) return ApiResponse.notFound(res, '活动不存在');
    ApiResponse.success(res, updated, '更新成功');
  } catch (err) {
    ApiResponse.error(res, '更新活动失败');
  }
});

/** 删除活动 */
router.delete('/activities/:id', async (req, res) => {
  try {
    await operationService.deleteActivity(req.params.id);
    ApiResponse.success(res, null, '删除成功');
  } catch (err) {
    ApiResponse.error(res, '删除活动失败');
  }
});

// ==================== 模拟盘费用配置 ====================

/** 获取全部模拟盘费用配置 */
router.get('/demo-fee', async (req, res) => {
  try {
    const list = await operationService.getDemoFeeConfigs();
    ApiResponse.success(res, list);
  } catch (err) {
    ApiResponse.error(res, '获取模拟盘费用配置失败');
  }
});

/** 设置/更新单品种模拟盘费用 */
router.post('/demo-fee', [
  body('symbol_id').isInt().withMessage('品种ID无效'),
  body('symbol').notEmpty().withMessage('品种代码不能为空'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return ApiResponse.badRequest(res, errors.array()[0].msg);
  try {
    await operationService.upsertDemoFeeConfig({ ...req.body, admin_id: req.admin.id });
    ApiResponse.success(res, null, '保存成功');
  } catch (err) {
    ApiResponse.error(res, '保存模拟盘费用失败');
  }
});

/** 恢复某品种为真实盘费率 */
router.post('/demo-fee/reset/:symbol', async (req, res) => {
  try {
    const result = await operationService.resetDemoFeeToReal(req.params.symbol);
    if (!result) return ApiResponse.notFound(res, '品种不存在');
    ApiResponse.success(res, result, '已恢复为真实盘设置');
  } catch (err) {
    ApiResponse.error(res, '恢复失败');
  }
});

/** 全部同步真实盘费率 */
router.post('/demo-fee/sync-all', async (req, res) => {
  try {
    const count = await operationService.syncAllDemoFeeFromReal(req.admin.id);
    ApiResponse.success(res, { syncCount: count }, `已同步 ${count} 个品种`);
  } catch (err) {
    ApiResponse.error(res, '同步失败');
  }
});

// ==================== 第三方接口管理 ====================

/** 接口列表 */
router.get('/integrations', async (req, res) => {
  try {
    const { page, pageSize, type, status } = req.query;
    const result = await operationService.getIntegrations({
      page: parseInt(page) || 1,
      pageSize: parseInt(pageSize) || 20,
      type, status,
    });
    ApiResponse.paginate(res, result);
  } catch (err) {
    ApiResponse.error(res, '获取接口列表失败');
  }
});

/** 接口详情 */
router.get('/integrations/:id', async (req, res) => {
  try {
    const detail = await operationService.getIntegrationDetail(req.params.id);
    if (!detail) return ApiResponse.notFound(res, '接口不存在');
    ApiResponse.success(res, detail);
  } catch (err) {
    ApiResponse.error(res, '获取接口详情失败');
  }
});

/** 创建接口配置 */
router.post('/integrations', [
  body('name').notEmpty().withMessage('接口名称不能为空'),
  body('type').notEmpty().withMessage('接口类型不能为空'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return ApiResponse.badRequest(res, errors.array()[0].msg);
  try {
    await operationService.createIntegration({ ...req.body, admin_id: req.admin.id });
    ApiResponse.success(res, null, '创建成功');
  } catch (err) {
    ApiResponse.error(res, '创建接口配置失败');
  }
});

/** 更新接口配置 */
router.put('/integrations/:id', async (req, res) => {
  try {
    const updated = await operationService.updateIntegration(req.params.id, req.body);
    if (!updated) return ApiResponse.notFound(res, '接口不存在');
    ApiResponse.success(res, updated, '更新成功');
  } catch (err) {
    ApiResponse.error(res, '更新接口配置失败');
  }
});

/** 删除接口配置 */
router.delete('/integrations/:id', async (req, res) => {
  try {
    await operationService.deleteIntegration(req.params.id);
    ApiResponse.success(res, null, '删除成功');
  } catch (err) {
    ApiResponse.error(res, '删除接口配置失败');
  }
});

/** 检测接口连通性 */
router.post('/integrations/:id/check', async (req, res) => {
  try {
    const result = await operationService.checkIntegrationConnectivity(req.params.id);
    if (!result) return ApiResponse.notFound(res, '接口不存在');
    ApiResponse.success(res, result);
  } catch (err) {
    ApiResponse.error(res, '检测失败');
  }
});

// ==================== 开屏广告管理 ====================

/** 获取开屏广告配置 */
router.get('/splash-ad', async (req, res) => {
  try {
    const { query: dbQuery } = require('../../config/database');
    const rows = await dbQuery("SELECT config_key, config_value FROM system_config WHERE config_key LIKE 'splash_%'");
    const config = {};
    rows.forEach(r => { config[r.config_key] = r.config_value; });
    ApiResponse.success(res, config);
  } catch (err) {
    ApiResponse.error(res, '获取开屏广告配置失败');
  }
});

/** 保存开屏广告配置 */
router.post('/splash-ad', async (req, res) => {
  try {
    const { query: dbQuery } = require('../../config/database');
    const configMap = {
      splash_enabled: req.body.splash_enabled,
      splash_duration: req.body.splash_duration,
      splash_image_url: req.body.splash_image_url,
      splash_link_url: req.body.splash_link_url,
      splash_rich_text: req.body.splash_rich_text,
    };
    for (const [key, value] of Object.entries(configMap)) {
      if (value !== undefined) {
        await dbQuery('UPDATE system_config SET config_value = ? WHERE config_key = ?', [String(value), key]);
      }
    }
    ApiResponse.success(res, null, '保存成功');
  } catch (err) {
    ApiResponse.error(res, '保存开屏广告配置失败');
  }
});

module.exports = router;
