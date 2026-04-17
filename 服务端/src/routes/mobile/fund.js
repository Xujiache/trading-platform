const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const { authenticateToken } = require('../../middleware/auth');
const ApiResponse = require('../../utils/response');
const fundService = require('../../services/fundService');
const accountService = require('../../services/accountService');

router.use(authenticateToken);

router.get('/payment-config', async (req, res) => {
  try {
    const config = await fundService.getPaymentConfig();
    ApiResponse.success(res, config);
  } catch (err) {
    ApiResponse.error(res, '获取支付配置失败');
  }
});

router.post('/deposit', [
  body('amount').isFloat({ min: 1 }).withMessage('入金金额无效'),
  body('paymentMethod').isIn(['wechat', 'alipay', 'usdt']).withMessage('支付方式无效'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return ApiResponse.badRequest(res, errors.array()[0].msg);
  try {
    const deposit = await fundService.createDeposit(req.user.id, req.body);
    ApiResponse.created(res, deposit, '入金申请已提交');
  } catch (err) {
    ApiResponse.badRequest(res, err.message);
  }
});

router.get('/deposits', async (req, res) => {
  try {
    const result = await fundService.getDeposits(req.user.id, req.query);
    ApiResponse.paginate(res, result);
  } catch (err) {
    ApiResponse.error(res, '获取入金记录失败');
  }
});

router.get('/withdraw-fee', async (req, res) => {
  try {
    const amount = parseFloat(req.query.amount);
    if (!amount || amount <= 0) return ApiResponse.badRequest(res, '金额无效');
    const result = await fundService.estimateWithdrawFee(amount);
    ApiResponse.success(res, result);
  } catch (err) {
    ApiResponse.error(res, '估算手续费失败');
  }
});

router.post('/withdraw', [
  body('amount').isFloat({ min: 1 }).withMessage('出金金额无效'),
  body('withdrawMethod').isIn(['wechat', 'alipay', 'usdt']).withMessage('出金方式无效'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return ApiResponse.badRequest(res, errors.array()[0].msg);
  try {
    const withdraw = await fundService.createWithdraw(req.user.id, req.body);
    ApiResponse.created(res, withdraw, '出金申请已提交');
  } catch (err) {
    ApiResponse.badRequest(res, err.message);
  }
});

router.get('/withdraws', async (req, res) => {
  try {
    const result = await fundService.getWithdraws(req.user.id, req.query);
    ApiResponse.paginate(res, result);
  } catch (err) {
    ApiResponse.error(res, '获取出金记录失败');
  }
});

router.get('/account', async (req, res) => {
  try {
    const { accountType = 'real' } = req.query;
    const overview = await accountService.getAccountOverview(req.user.id, accountType);
    ApiResponse.success(res, overview);
  } catch (err) {
    ApiResponse.error(res, '获取资金账户信息失败');
  }
});

router.get('/flows', async (req, res) => {
  try {
    const result = await fundService.getFundFlows(req.user.id, req.query);
    ApiResponse.success(res, {
      list: result.list,
      pagination: {
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: Math.ceil(result.total / result.pageSize),
      },
      summary: result.summary,
    });
  } catch (err) {
    ApiResponse.error(res, '获取资金流水失败');
  }
});

router.get('/fees', async (req, res) => {
  try {
    const result = await fundService.getFundFlows(req.user.id, { ...req.query, flowType: 'commission' });
    ApiResponse.success(res, result.summary);
  } catch (err) {
    ApiResponse.error(res, '获取费用汇总失败');
  }
});

const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../../config');
const uploadStorage = multer.diskStorage({
  destination(req, file, cb) {
    const uploadPath = path.join(process.cwd(), config.upload.dir, 'qrcode');
    const fs = require('fs');
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename(req, file, cb) {
    cb(null, `${uuidv4()}${path.extname(file.originalname)}`);
  },
});
const qrcodeUpload = multer({
  storage: uploadStorage,
  fileFilter: (req, file, cb) => {
    if (['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'].includes(file.mimetype)) cb(null, true);
    else cb(new Error('仅支持 JPG/PNG/GIF/WebP 格式'), false);
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post('/upload-qrcode', qrcodeUpload.single('file'), (req, res) => {
  if (!req.file) return ApiResponse.badRequest(res, '请选择图片');
  const relativePath = `/${config.upload.dir}/qrcode/${req.file.filename}`;
  const url = `${config.upload.baseUrl}${relativePath}`;
  ApiResponse.success(res, { url, path: relativePath }, '上传成功');
});

router.post('/bank-cards', [
  body('cardType').isIn(['wechat', 'alipay', 'usdt']).withMessage('账户类型无效'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return ApiResponse.badRequest(res, errors.array()[0].msg);
  try {
    const card = await fundService.addBankCard(req.user.id, req.body);
    ApiResponse.created(res, card, '收款账户添加成功');
  } catch (err) {
    ApiResponse.badRequest(res, err.message);
  }
});

router.get('/bank-cards', async (req, res) => {
  try {
    const cards = await fundService.getBankCards(req.user.id);
    ApiResponse.success(res, cards);
  } catch (err) {
    ApiResponse.error(res, '获取收款账户列表失败');
  }
});

router.delete('/bank-cards/:id', [
  param('id').isInt({ min: 1 }).withMessage('账户ID无效'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return ApiResponse.badRequest(res, errors.array()[0].msg);
  try {
    await fundService.deleteBankCard(req.user.id, parseInt(req.params.id));
    ApiResponse.success(res, null, '收款账户已删除');
  } catch (err) {
    ApiResponse.badRequest(res, err.message);
  }
});

router.put('/bank-cards/:id/default', [
  param('id').isInt({ min: 1 }).withMessage('账户ID无效'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return ApiResponse.badRequest(res, errors.array()[0].msg);
  try {
    await fundService.setDefaultBankCard(req.user.id, parseInt(req.params.id));
    ApiResponse.success(res, null, '已设为默认收款账户');
  } catch (err) {
    ApiResponse.badRequest(res, err.message);
  }
});

module.exports = router;
