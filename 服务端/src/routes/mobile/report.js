const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const ApiResponse = require('../../utils/response');
const reportService = require('../../services/reportService');

router.use(authenticateToken);

router.get('/trade', async (req, res) => {
  try {
    const result = await reportService.getTradeReport(req.user.id, req.query);
    ApiResponse.success(res, result);
  } catch (err) {
    ApiResponse.error(res, '获取交易报表失败');
  }
});

router.get('/pnl', async (req, res) => {
  try {
    const result = await reportService.getPnlReport(req.user.id, req.query);
    ApiResponse.success(res, result);
  } catch (err) {
    ApiResponse.error(res, '获取盈亏报表失败');
  }
});

router.get('/fees', async (req, res) => {
  try {
    const result = await reportService.getFeesReport(req.user.id, req.query);
    ApiResponse.success(res, result);
  } catch (err) {
    ApiResponse.error(res, '获取费用报表失败');
  }
});

module.exports = router;
