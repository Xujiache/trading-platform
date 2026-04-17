const express = require('express');
const router = express.Router();
const { param, validationResult } = require('express-validator');
const { authenticateAdmin } = require('../../middleware/auth');
const { auditLog } = require('../../middleware/auditLog');
const ApiResponse = require('../../utils/response');
const fundService = require('../../services/fundService');

router.use(authenticateAdmin);

router.get('/fund/deposits', async (req, res) => {
  try {
    const result = await fundService.getAdminDeposits(req.query);
    ApiResponse.paginate(res, result);
  } catch (err) {
    ApiResponse.error(res, '获取入金列表失败');
  }
});

router.post('/fund/deposits/:id/confirm', [
  param('id').isInt({ min: 1 }).withMessage('入金ID无效'),
], auditLog('财务管理', '确认入金', { targetType: 'deposit' }), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return ApiResponse.badRequest(res, errors.array()[0].msg);
  try {
    await fundService.confirmDeposit(parseInt(req.params.id), req.admin.id, req.body);
    ApiResponse.success(res, null, '入金已确认');
  } catch (err) {
    ApiResponse.badRequest(res, err.message);
  }
});

router.put('/fund/deposit/:id/confirm', [
  param('id').isInt({ min: 1 }).withMessage('入金ID无效'),
], auditLog('财务管理', '确认入金', { targetType: 'deposit' }), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return ApiResponse.badRequest(res, errors.array()[0].msg);
  try {
    await fundService.confirmDeposit(parseInt(req.params.id), req.admin.id, req.body);
    ApiResponse.success(res, null, '入金已确认');
  } catch (err) {
    ApiResponse.badRequest(res, err.message);
  }
});

router.post('/fund/deposits/:id/reject', [
  param('id').isInt({ min: 1 }).withMessage('入金ID无效'),
], auditLog('财务管理', '驳回入金', { targetType: 'deposit' }), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return ApiResponse.badRequest(res, errors.array()[0].msg);
  try {
    await fundService.rejectDeposit(parseInt(req.params.id), req.admin.id, req.body);
    ApiResponse.success(res, null, '入金已驳回');
  } catch (err) {
    ApiResponse.badRequest(res, err.message);
  }
});

router.get('/fund/withdraws', async (req, res) => {
  try {
    const result = await fundService.getAdminWithdraws(req.query);
    ApiResponse.paginate(res, result);
  } catch (err) {
    ApiResponse.error(res, '获取出金列表失败');
  }
});

router.post('/fund/withdraws/:id/approve', [
  param('id').isInt({ min: 1 }).withMessage('出金ID无效'),
], auditLog('财务管理', '审核通过出金', { targetType: 'withdraw' }), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return ApiResponse.badRequest(res, errors.array()[0].msg);
  try {
    await fundService.approveWithdraw(parseInt(req.params.id), req.admin.id, req.body);
    ApiResponse.success(res, null, '出金已审核通过');
  } catch (err) {
    ApiResponse.badRequest(res, err.message);
  }
});

router.post('/fund/withdraws/:id/reject', [
  param('id').isInt({ min: 1 }).withMessage('出金ID无效'),
], auditLog('财务管理', '驳回出金', { targetType: 'withdraw' }), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return ApiResponse.badRequest(res, errors.array()[0].msg);
  try {
    await fundService.rejectWithdraw(parseInt(req.params.id), req.admin.id, req.body);
    ApiResponse.success(res, null, '出金已驳回');
  } catch (err) {
    ApiResponse.badRequest(res, err.message);
  }
});

router.post('/fund/withdraws/:id/complete', [
  param('id').isInt({ min: 1 }).withMessage('出金ID无效'),
], auditLog('财务管理', '完成出金打款', { targetType: 'withdraw' }), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return ApiResponse.badRequest(res, errors.array()[0].msg);
  try {
    await fundService.completeWithdraw(parseInt(req.params.id), req.admin.id, req.body);
    ApiResponse.success(res, null, '出金已标记完成');
  } catch (err) {
    ApiResponse.badRequest(res, err.message);
  }
});

router.put('/fund/withdraw/:id/audit', [
  param('id').isInt({ min: 1 }).withMessage('出金ID无效'),
], auditLog('财务管理', '审核出金', { targetType: 'withdraw' }), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return ApiResponse.badRequest(res, errors.array()[0].msg);
  try {
    const { action } = req.body;
    if (action === 'approve') {
      await fundService.approveWithdraw(parseInt(req.params.id), req.admin.id, req.body);
    } else {
      await fundService.rejectWithdraw(parseInt(req.params.id), req.admin.id, req.body);
    }
    ApiResponse.success(res, null, '审核操作完成');
  } catch (err) {
    ApiResponse.badRequest(res, err.message);
  }
});

router.put('/fund/withdraw/:id/pay', [
  param('id').isInt({ min: 1 }).withMessage('出金ID无效'),
], auditLog('财务管理', '出金打款', { targetType: 'withdraw' }), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return ApiResponse.badRequest(res, errors.array()[0].msg);
  try {
    await fundService.completeWithdraw(parseInt(req.params.id), req.admin.id, req.body);
    ApiResponse.success(res, null, '打款操作完成');
  } catch (err) {
    ApiResponse.badRequest(res, err.message);
  }
});

router.get('/fund/flows', async (req, res) => {
  try {
    const result = await fundService.getAdminFundFlows(req.query);
    ApiResponse.paginate(res, result);
  } catch (err) {
    ApiResponse.error(res, '获取资金流水失败');
  }
});

router.get('/fund/statistics', async (req, res) => {
  try {
    const result = await fundService.getFinancialStatistics();
    ApiResponse.success(res, result);
  } catch (err) {
    ApiResponse.error(res, '获取财务统计失败');
  }
});

router.get('/fund/stats', async (req, res) => {
  try {
    const result = await fundService.getFinancialStatistics();
    ApiResponse.success(res, result);
  } catch (err) {
    ApiResponse.error(res, '获取财务统计失败');
  }
});

module.exports = router;
