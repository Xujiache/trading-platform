const express = require('express');
const router = express.Router();
const { authenticateAdmin } = require('../../middleware/auth');
const ApiResponse = require('../../utils/response');
const reportService = require('../../services/reportService');

router.use(authenticateAdmin);

router.get('/report/operations', async (req, res) => {
  try {
    const result = await reportService.getOperationsOverview(req.query);
    ApiResponse.success(res, result);
  } catch (err) {
    ApiResponse.error(res, '获取运营概览失败');
  }
});

router.get('/report/risk', async (req, res) => {
  try {
    const result = await reportService.getRiskReport(req.query);
    ApiResponse.success(res, result);
  } catch (err) {
    ApiResponse.error(res, '获取风控报表失败');
  }
});

router.get('/report/user-analysis', async (req, res) => {
  try {
    const result = await reportService.getUserAnalysis(req.query);
    ApiResponse.success(res, result);
  } catch (err) {
    ApiResponse.error(res, '获取用户分析失败');
  }
});

module.exports = router;
