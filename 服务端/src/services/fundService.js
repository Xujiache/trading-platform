const { query, getConnection } = require('../config/database');
const accountService = require('./accountService');

function generateOrderNo(prefix = 'D') {
  const now = new Date();
  const ts = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0');
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${ts}${rand}`;
}

async function getPaymentConfig() {
  const rows = await query(
    "SELECT config_key, config_value FROM system_config WHERE category = 'fund'"
  );
  const cfg = {};
  for (const r of rows) {
    cfg[r.config_key] = r.config_value;
  }
  return {
    minDepositAmount: parseFloat(cfg.min_deposit_amount || '100'),
    minWithdrawAmount: parseFloat(cfg.min_withdraw_amount || '50'),
    withdrawFeeRate: parseFloat(cfg.withdraw_fee_rate || '0.005'),
    wechatPayQrcode: cfg.wechat_pay_qrcode || '',
    alipayPayQrcode: cfg.alipay_pay_qrcode || '',
    usdtTrc20Address: cfg.usdt_trc20_address || '',
    usdtTrc20Qrcode: cfg.usdt_trc20_qrcode || '',
  };
}

async function createDeposit(userId, { amount, paymentMethod, paymentRef, remark, proofImage }) {
  const config = await getPaymentConfig();
  if (amount < config.minDepositAmount) {
    throw new Error(`最低入金金额为 ${config.minDepositAmount} 元`);
  }
  const depositNo = generateOrderNo('D');
  const result = await query(
    `INSERT INTO deposits (deposit_no, user_id, amount, payment_method, payment_ref, remark, proof_image, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
    [depositNo, userId, amount, paymentMethod, paymentRef || '', remark || '', proofImage || '']
  );
  const rows = await query('SELECT * FROM deposits WHERE id = ?', [result.insertId]);
  return rows[0];
}

async function getDeposits(userId, { page = 1, pageSize = 20, status }) {
  const conditions = ['user_id = ?'];
  const params = [userId];
  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }
  const where = `WHERE ${conditions.join(' AND ')}`;
  const countResult = await query(`SELECT COUNT(*) as total FROM deposits ${where}`, params);
  const total = countResult[0].total;
  const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(pageSize);
  const list = await query(
    `SELECT * FROM deposits ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, parseInt(pageSize), offset]
  );
  return { list, total, page: parseInt(page), pageSize: parseInt(pageSize) };
}

async function estimateWithdrawFee(amount) {
  const config = await getPaymentConfig();
  const fee = parseFloat((amount * config.withdrawFeeRate).toFixed(4));
  const actualAmount = parseFloat((amount - fee).toFixed(4));
  return { amount, fee, feeRate: config.withdrawFeeRate, actualAmount };
}

async function createWithdraw(userId, { amount, withdrawMethod, bankCardId, accountName, accountNo, qrcodeImage, remark }) {
  const config = await getPaymentConfig();
  if (amount < config.minWithdrawAmount) {
    throw new Error(`最低出金金额为 ${config.minWithdrawAmount} 元`);
  }

  const account = await accountService.getOrCreateAccount(userId, 'real');
  const balance = parseFloat(account.balance);
  const frozenMargin = parseFloat(account.frozen_margin);
  const available = balance - frozenMargin;
  if (amount > available) {
    throw new Error(`可用余额不足，当前可用: ${available.toFixed(2)}`);
  }

  const fee = parseFloat((amount * config.withdrawFeeRate).toFixed(4));
  const actualAmount = parseFloat((amount - fee).toFixed(4));
  const withdrawNo = generateOrderNo('W');

  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    const balanceBefore = balance;
    await conn.execute(
      `UPDATE fund_accounts SET balance = balance - ? WHERE user_id = ? AND account_type = 'real' AND balance >= ?`,
      [amount, userId, amount]
    );
    const balanceAfter = parseFloat((balanceBefore - amount).toFixed(4));

    await conn.execute(
      `INSERT INTO withdraws (withdraw_no, user_id, amount, fee, actual_amount, withdraw_method, bank_card_id, account_name, account_no, qrcode_image, remark, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [withdrawNo, userId, amount, fee, actualAmount, withdrawMethod, bankCardId || null, accountName || '', accountNo || '', qrcodeImage || '', remark || '']
    );
    const [[withdraw]] = await conn.execute('SELECT * FROM withdraws WHERE withdraw_no = ?', [withdrawNo]);

    await conn.execute(
      `INSERT INTO fund_flows (user_id, account_type, flow_type, amount, balance_before, balance_after, ref_type, ref_id, description)
       VALUES (?, 'real', 'withdraw', ?, ?, ?, 'withdraw', ?, ?)`,
      [userId, -amount, balanceBefore, balanceAfter, withdraw.id, `出金申请 ${withdrawNo}`]
    );

    if (fee > 0) {
      await conn.execute(
        `INSERT INTO fund_flows (user_id, account_type, flow_type, amount, balance_before, balance_after, ref_type, ref_id, description)
         VALUES (?, 'real', 'withdraw_fee', ?, ?, ?, 'withdraw', ?, ?)`,
        [userId, -fee, balanceAfter, balanceAfter, withdraw.id, `出金手续费 ${withdrawNo}`]
      );
    }

    await conn.commit();
    return withdraw;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function getWithdraws(userId, { page = 1, pageSize = 20, status }) {
  const conditions = ['user_id = ?'];
  const params = [userId];
  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }
  const where = `WHERE ${conditions.join(' AND ')}`;
  const countResult = await query(`SELECT COUNT(*) as total FROM withdraws ${where}`, params);
  const total = countResult[0].total;
  const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(pageSize);
  const list = await query(
    `SELECT * FROM withdraws ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, parseInt(pageSize), offset]
  );
  return { list, total, page: parseInt(page), pageSize: parseInt(pageSize) };
}

async function getFundFlows(userId, { page = 1, pageSize = 20, flowType, accountType = 'real', startDate, endDate }) {
  const conditions = ['user_id = ?', 'account_type = ?'];
  const params = [userId, accountType];

  if (flowType && flowType !== 'all') {
    const typeMap = {
      deposit: ['deposit'],
      withdraw: ['withdraw'],
      withdraw_fee: ['withdraw_fee'],
      trade_pnl: ['trade_pnl'],
      commission: ['commission', 'spread'],
      swap: ['swap'],
    };
    const types = typeMap[flowType] || [flowType];
    conditions.push(`flow_type IN (${types.map(() => '?').join(',')})`);
    params.push(...types);
  }
  if (startDate) { conditions.push('created_at >= ?'); params.push(startDate); }
  if (endDate) { conditions.push('created_at <= ?'); params.push(endDate + ' 23:59:59'); }

  const where = `WHERE ${conditions.join(' AND ')}`;
  const countResult = await query(`SELECT COUNT(*) as total FROM fund_flows ${where}`, params);
  const total = countResult[0].total;
  const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(pageSize);
  const list = await query(
    `SELECT * FROM fund_flows ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, parseInt(pageSize), offset]
  );

  const summaryResult = await query(
    `SELECT
       COALESCE(SUM(CASE WHEN flow_type = 'deposit' THEN amount ELSE 0 END), 0) as totalDeposit,
       COALESCE(SUM(CASE WHEN flow_type = 'withdraw' THEN ABS(amount) ELSE 0 END), 0) as totalWithdraw,
       COALESCE(SUM(CASE WHEN flow_type IN ('withdraw_fee','commission','spread','swap') THEN ABS(amount) ELSE 0 END), 0) as totalFees
     FROM fund_flows WHERE user_id = ? AND account_type = ?`,
    [userId, accountType]
  );

  return {
    list, total, page: parseInt(page), pageSize: parseInt(pageSize),
    summary: {
      totalDeposit: parseFloat(summaryResult[0].totalDeposit),
      totalWithdraw: parseFloat(summaryResult[0].totalWithdraw),
      totalFees: parseFloat(summaryResult[0].totalFees),
    },
  };
}

async function addBankCard(userId, { cardType, accountName, accountNo, qrcodeImage }) {
  if (cardType === 'usdt' && accountNo) {
    if (!/^T[a-zA-Z0-9]{33}$/.test(accountNo)) {
      throw new Error('USDT-TRC20 地址格式不正确');
    }
  }
  const existing = await query(
    'SELECT COUNT(*) as cnt FROM bank_cards WHERE user_id = ? AND status = 1',
    [userId]
  );
  const isDefault = existing[0].cnt === 0 ? 1 : 0;

  const result = await query(
    `INSERT INTO bank_cards (user_id, card_type, account_name, account_no, qrcode_image, is_default)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, cardType, accountName || '', accountNo || '', qrcodeImage || '', isDefault]
  );
  const rows = await query('SELECT * FROM bank_cards WHERE id = ?', [result.insertId]);
  return rows[0];
}

async function getBankCards(userId) {
  return query(
    'SELECT * FROM bank_cards WHERE user_id = ? AND status = 1 ORDER BY is_default DESC, created_at DESC',
    [userId]
  );
}

async function deleteBankCard(userId, cardId) {
  const rows = await query('SELECT * FROM bank_cards WHERE id = ? AND user_id = ?', [cardId, userId]);
  if (rows.length === 0) throw new Error('收款账户不存在');
  await query('UPDATE bank_cards SET status = 0 WHERE id = ?', [cardId]);
  return true;
}

async function setDefaultBankCard(userId, cardId) {
  const rows = await query('SELECT * FROM bank_cards WHERE id = ? AND user_id = ? AND status = 1', [cardId, userId]);
  if (rows.length === 0) throw new Error('收款账户不存在');
  await query('UPDATE bank_cards SET is_default = 0 WHERE user_id = ?', [userId]);
  await query('UPDATE bank_cards SET is_default = 1 WHERE id = ?', [cardId]);
  return true;
}

async function confirmDeposit(depositId, adminId, { adminRemark } = {}) {
  const rows = await query('SELECT * FROM deposits WHERE id = ?', [depositId]);
  if (rows.length === 0) throw new Error('入金记录不存在');
  const deposit = rows[0];
  if (deposit.status !== 'pending' && deposit.status !== 'reviewing') {
    throw new Error('当前状态不允许审核');
  }

  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    await conn.execute(
      `UPDATE deposits SET status = 'completed', admin_id = ?, admin_remark = ?, reviewed_at = NOW()
       WHERE id = ?`,
      [adminId, adminRemark || '', depositId]
    );

    const [[account]] = await conn.execute(
      "SELECT * FROM fund_accounts WHERE user_id = ? AND account_type = 'real'",
      [deposit.user_id]
    );

    let balanceBefore = 0;
    if (account) {
      balanceBefore = parseFloat(account.balance);
      await conn.execute(
        `UPDATE fund_accounts SET balance = balance + ?, total_deposit = total_deposit + ?
         WHERE user_id = ? AND account_type = 'real'`,
        [deposit.amount, deposit.amount, deposit.user_id]
      );
    } else {
      await conn.execute(
        `INSERT INTO fund_accounts (user_id, account_type, balance, total_deposit)
         VALUES (?, 'real', ?, ?)`,
        [deposit.user_id, deposit.amount, deposit.amount]
      );
    }
    const balanceAfter = parseFloat((balanceBefore + parseFloat(deposit.amount)).toFixed(4));

    await conn.execute(
      `INSERT INTO fund_flows (user_id, account_type, flow_type, amount, balance_before, balance_after, ref_type, ref_id, description)
       VALUES (?, 'real', 'deposit', ?, ?, ?, 'deposit', ?, ?)`,
      [deposit.user_id, deposit.amount, balanceBefore, balanceAfter, depositId, `入金到账 ${deposit.deposit_no}`]
    );

    await conn.commit();
    return true;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function rejectDeposit(depositId, adminId, { adminRemark } = {}) {
  const rows = await query('SELECT * FROM deposits WHERE id = ?', [depositId]);
  if (rows.length === 0) throw new Error('入金记录不存在');
  if (rows[0].status !== 'pending' && rows[0].status !== 'reviewing') {
    throw new Error('当前状态不允许操作');
  }
  await query(
    `UPDATE deposits SET status = 'failed', admin_id = ?, admin_remark = ?, reviewed_at = NOW() WHERE id = ?`,
    [adminId, adminRemark || '', depositId]
  );
  return true;
}

async function approveWithdraw(withdrawId, adminId, { adminRemark } = {}) {
  const rows = await query('SELECT * FROM withdraws WHERE id = ?', [withdrawId]);
  if (rows.length === 0) throw new Error('出金记录不存在');
  if (rows[0].status !== 'pending' && rows[0].status !== 'reviewing') {
    throw new Error('当前状态不允许审核');
  }
  await query(
    `UPDATE withdraws SET status = 'approved', admin_id = ?, admin_remark = ?, reviewed_at = NOW() WHERE id = ?`,
    [adminId, adminRemark || '', withdrawId]
  );
  return true;
}

async function rejectWithdraw(withdrawId, adminId, { adminRemark } = {}) {
  const rows = await query('SELECT * FROM withdraws WHERE id = ?', [withdrawId]);
  if (rows.length === 0) throw new Error('出金记录不存在');
  const withdraw = rows[0];
  if (withdraw.status !== 'pending' && withdraw.status !== 'reviewing' && withdraw.status !== 'approved') {
    throw new Error('当前状态不允许驳回');
  }

  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    await conn.execute(
      `UPDATE withdraws SET status = 'rejected', admin_id = ?, admin_remark = ?, reviewed_at = NOW() WHERE id = ?`,
      [adminId, adminRemark || '', withdrawId]
    );

    await conn.execute(
      `UPDATE fund_accounts SET balance = balance + ? WHERE user_id = ? AND account_type = 'real'`,
      [withdraw.amount, withdraw.user_id]
    );

    const [[account]] = await conn.execute(
      "SELECT balance FROM fund_accounts WHERE user_id = ? AND account_type = 'real'",
      [withdraw.user_id]
    );
    const balanceAfter = parseFloat(account.balance);
    const balanceBefore = parseFloat((balanceAfter - parseFloat(withdraw.amount)).toFixed(4));

    await conn.execute(
      `INSERT INTO fund_flows (user_id, account_type, flow_type, amount, balance_before, balance_after, ref_type, ref_id, description)
       VALUES (?, 'real', 'deposit', ?, ?, ?, 'withdraw', ?, ?)`,
      [withdraw.user_id, withdraw.amount, balanceBefore, balanceAfter, withdrawId, `出金驳回退款 ${withdraw.withdraw_no}`]
    );

    await conn.commit();
    return true;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function completeWithdraw(withdrawId, adminId, { adminRemark } = {}) {
  const rows = await query('SELECT * FROM withdraws WHERE id = ?', [withdrawId]);
  if (rows.length === 0) throw new Error('出金记录不存在');
  if (rows[0].status !== 'approved' && rows[0].status !== 'processing') {
    throw new Error('当前状态不允许标记完成');
  }
  await query(
    `UPDATE withdraws SET status = 'completed', admin_remark = CONCAT(IFNULL(admin_remark,''), ' ', ?), completed_at = NOW() WHERE id = ?`,
    [adminRemark || '', withdrawId]
  );

  await query(
    `UPDATE fund_accounts SET total_withdraw = total_withdraw + ? WHERE user_id = ? AND account_type = 'real'`,
    [rows[0].amount, rows[0].user_id]
  );

  return true;
}

async function getAdminDeposits({ page = 1, pageSize = 20, status, userId, startDate, endDate }) {
  const conditions = ['1=1'];
  const params = [];
  if (status) { conditions.push('d.status = ?'); params.push(status); }
  if (userId) { conditions.push('d.user_id = ?'); params.push(userId); }
  if (startDate) { conditions.push('d.created_at >= ?'); params.push(startDate); }
  if (endDate) { conditions.push('d.created_at <= ?'); params.push(endDate + ' 23:59:59'); }
  const where = `WHERE ${conditions.join(' AND ')}`;
  const countResult = await query(`SELECT COUNT(*) as total FROM deposits d ${where}`, params);
  const total = countResult[0].total;
  const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(pageSize);
  const list = await query(
    `SELECT d.*, u.email as user_email, u.nickname as user_nickname
     FROM deposits d LEFT JOIN users u ON d.user_id = u.id
     ${where} ORDER BY d.created_at DESC LIMIT ? OFFSET ?`,
    [...params, parseInt(pageSize), offset]
  );
  return { list, total, page: parseInt(page), pageSize: parseInt(pageSize) };
}

async function getAdminWithdraws({ page = 1, pageSize = 20, status, userId, startDate, endDate }) {
  const conditions = ['1=1'];
  const params = [];
  if (status) { conditions.push('w.status = ?'); params.push(status); }
  if (userId) { conditions.push('w.user_id = ?'); params.push(userId); }
  if (startDate) { conditions.push('w.created_at >= ?'); params.push(startDate); }
  if (endDate) { conditions.push('w.created_at <= ?'); params.push(endDate + ' 23:59:59'); }
  const where = `WHERE ${conditions.join(' AND ')}`;
  const countResult = await query(`SELECT COUNT(*) as total FROM withdraws w ${where}`, params);
  const total = countResult[0].total;
  const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(pageSize);
  const list = await query(
    `SELECT w.*, u.email as user_email, u.nickname as user_nickname
     FROM withdraws w LEFT JOIN users u ON w.user_id = u.id
     ${where} ORDER BY w.created_at DESC LIMIT ? OFFSET ?`,
    [...params, parseInt(pageSize), offset]
  );
  return { list, total, page: parseInt(page), pageSize: parseInt(pageSize) };
}

async function getAdminFundFlows({ page = 1, pageSize = 20, flowType, userId, startDate, endDate }) {
  const conditions = ['1=1'];
  const params = [];
  if (flowType && flowType !== 'all') { conditions.push('f.flow_type = ?'); params.push(flowType); }
  if (userId) { conditions.push('f.user_id = ?'); params.push(userId); }
  if (startDate) { conditions.push('f.created_at >= ?'); params.push(startDate); }
  if (endDate) { conditions.push('f.created_at <= ?'); params.push(endDate + ' 23:59:59'); }
  const where = `WHERE ${conditions.join(' AND ')}`;
  const countResult = await query(`SELECT COUNT(*) as total FROM fund_flows f ${where}`, params);
  const total = countResult[0].total;
  const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(pageSize);
  const list = await query(
    `SELECT f.*, u.email as user_email, u.nickname as user_nickname
     FROM fund_flows f LEFT JOIN users u ON f.user_id = u.id
     ${where} ORDER BY f.created_at DESC LIMIT ? OFFSET ?`,
    [...params, parseInt(pageSize), offset]
  );
  return { list, total, page: parseInt(page), pageSize: parseInt(pageSize) };
}

async function getFinancialStatistics() {
  const result = await query(
    `SELECT
       COALESCE((SELECT SUM(amount) FROM deposits WHERE status = 'completed'), 0) as totalDeposit,
       COALESCE((SELECT SUM(amount) FROM withdraws WHERE status = 'completed'), 0) as totalWithdraw,
       COALESCE((SELECT SUM(fee) FROM withdraws WHERE status = 'completed'), 0) as totalWithdrawFee,
       COALESCE((SELECT COUNT(*) FROM withdraws WHERE status IN ('pending','reviewing','approved')), 0) as pendingWithdrawCount,
       COALESCE((SELECT SUM(amount) FROM withdraws WHERE status IN ('pending','reviewing','approved')), 0) as pendingWithdrawAmount,
       COALESCE((SELECT COUNT(*) FROM deposits WHERE status = 'pending'), 0) as pendingDepositCount`
  );
  return {
    totalDeposit: parseFloat(result[0].totalDeposit),
    totalWithdraw: parseFloat(result[0].totalWithdraw),
    totalWithdrawFee: parseFloat(result[0].totalWithdrawFee),
    pendingWithdrawCount: result[0].pendingWithdrawCount,
    pendingWithdrawAmount: parseFloat(result[0].pendingWithdrawAmount),
    pendingDepositCount: result[0].pendingDepositCount,
  };
}

module.exports = {
  getPaymentConfig,
  createDeposit,
  getDeposits,
  estimateWithdrawFee,
  createWithdraw,
  getWithdraws,
  getFundFlows,
  addBankCard,
  getBankCards,
  deleteBankCard,
  setDefaultBankCard,
  confirmDeposit,
  rejectDeposit,
  approveWithdraw,
  rejectWithdraw,
  completeWithdraw,
  getAdminDeposits,
  getAdminWithdraws,
  getAdminFundFlows,
  getFinancialStatistics,
};
