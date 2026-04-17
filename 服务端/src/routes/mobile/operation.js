const express = require('express');
const router = express.Router();
const ApiResponse = require('../../utils/response');
const operationService = require('../../services/operationService');

/** 获取首页聚合数据（Banner + 奖励卡片） */
router.get('/homepage', async (req, res) => {
  try {
    const data = await operationService.getHomepageAggregation();
    ApiResponse.success(res, data);
  } catch (err) {
    ApiResponse.error(res, '获取首页数据失败');
  }
});

/** 获取有效 Banner 列表 */
router.get('/banners', async (req, res) => {
  try {
    const position = req.query.position || 'top';
    const banners = await operationService.getActiveBanners(position);
    ApiResponse.success(res, banners);
  } catch (err) {
    ApiResponse.error(res, '获取Banner失败');
  }
});

/** 记录 Banner 点击 */
router.post('/banners/:id/click', async (req, res) => {
  try {
    await operationService.clickBanner(req.params.id);
    ApiResponse.success(res);
  } catch (err) {
    ApiResponse.error(res, '记录点击失败');
  }
});

/** 获取奖励卡片列表 */
router.get('/reward-cards', async (req, res) => {
  try {
    const cards = await operationService.getActiveRewardCards();
    ApiResponse.success(res, cards);
  } catch (err) {
    ApiResponse.error(res, '获取奖励卡片失败');
  }
});

/** 获取活动列表 */
router.get('/activities', async (req, res) => {
  try {
    const { page, pageSize } = req.query;
    const result = await operationService.getPublicActivities({
      page: parseInt(page) || 1,
      pageSize: parseInt(pageSize) || 10,
    });
    ApiResponse.paginate(res, result);
  } catch (err) {
    ApiResponse.error(res, '获取活动列表失败');
  }
});

/** 获取活动详情 */
router.get('/activities/:id', async (req, res) => {
  try {
    const detail = await operationService.getActivityDetail(req.params.id);
    if (!detail) return ApiResponse.notFound(res, '活动不存在');
    ApiResponse.success(res, detail);
  } catch (err) {
    ApiResponse.error(res, '获取活动详情失败');
  }
});

module.exports = router;
