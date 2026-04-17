const { query, getConnection } = require('../config/database');

const DEMO_INITIAL_BALANCE = 10000;

async function getOrCreateAccount(userId, accountType = 'demo') {
  const rows = await query(
    'SELECT * FROM fund_accounts WHERE user_id = ? AND account_type = ?',
    [userId, accountType]
  );
  if (rows.length > 0) return rows[0];

  const initialBalance = accountType === 'demo' ? DEMO_INITIAL_BALANCE : 0;
  const result = await query(
    `INSERT INTO fund_accounts (user_id, account_type, balance, total_deposit)
     VALUES (?, ?, ?, ?)`,
    [userId, accountType, initialBalance, initialBalance]
  );
  const newAccount = await query('SELECT * FROM fund_accounts WHERE id = ?', [result.insertId]);
  return newAccount[0];
}

async function getAccountOverview(userId, accountType = 'demo') {
  const account = await getOrCreateAccount(userId, accountType);
  const balance = parseFloat(account.balance);
  const frozenMargin = parseFloat(account.frozen_margin);
  const floatingPnl = parseFloat(account.floating_pnl);

  const equity = parseFloat((balance + floatingPnl).toFixed(4));
  const availableMargin = parseFloat((equity - frozenMargin).toFixed(4));
  const marginLevel = frozenMargin > 0
    ? parseFloat(((equity / frozenMargin) * 100).toFixed(2))
    : 0;

  return {
    accountId: account.id,
    userId: account.user_id,
    accountType: account.account_type,
    balance,
    equity,
    frozenMargin,
    availableMargin,
    floatingPnl,
    marginLevel,
    totalDeposit: parseFloat(account.total_deposit),
    totalWithdraw: parseFloat(account.total_withdraw),
    totalCommission: parseFloat(account.total_commission),
    totalSwap: parseFloat(account.total_swap),
    totalProfit: parseFloat(account.total_profit),
    status: account.status,
  };
}

async function freezeMargin(userId, accountType, amount, conn) {
  const db = conn || { execute: (sql, params) => query(sql, params) };
  const [result] = await db.execute(
    `UPDATE fund_accounts SET frozen_margin = frozen_margin + ?
     WHERE user_id = ? AND account_type = ? AND status = 'active'`,
    [amount, userId, accountType]
  );
  return result.affectedRows > 0;
}

async function releaseMargin(userId, accountType, amount, conn) {
  const db = conn || { execute: (sql, params) => query(sql, params) };
  const [result] = await db.execute(
    `UPDATE fund_accounts SET frozen_margin = GREATEST(frozen_margin - ?, 0)
     WHERE user_id = ? AND account_type = ?`,
    [amount, userId, accountType]
  );
  return result.affectedRows > 0;
}

async function deductBalance(userId, accountType, amount, conn) {
  const db = conn || { execute: (sql, params) => query(sql, params) };
  const [result] = await db.execute(
    `UPDATE fund_accounts SET balance = balance - ?
     WHERE user_id = ? AND account_type = ? AND balance >= ? AND status = 'active'`,
    [amount, userId, accountType, amount]
  );
  return result.affectedRows > 0;
}

async function addBalance(userId, accountType, amount, conn) {
  const db = conn || { execute: (sql, params) => query(sql, params) };
  const [result] = await db.execute(
    `UPDATE fund_accounts SET balance = balance + ?
     WHERE user_id = ? AND account_type = ?`,
    [amount, userId, accountType]
  );
  return result.affectedRows > 0;
}

async function settleOrder(userId, accountType, margin, pnl, commission, swap, conn) {
  const db = conn || { execute: (sql, params) => query(sql, params) };
  await db.execute(
    `UPDATE fund_accounts SET
       balance = balance + ? + ?,
       frozen_margin = GREATEST(frozen_margin - ?, 0),
       total_commission = total_commission + ?,
       total_swap = total_swap + ?,
       total_profit = total_profit + ?
     WHERE user_id = ? AND account_type = ?`,
    [margin, pnl, margin, commission, Math.abs(swap), pnl, userId, accountType]
  );
}

async function updateFloatingPnl(userId, accountType, floatingPnl) {
  await query(
    'UPDATE fund_accounts SET floating_pnl = ? WHERE user_id = ? AND account_type = ?',
    [floatingPnl, userId, accountType]
  );
}

async function recordFlow(userId, accountType, orderId, flowType, amount, balanceBefore, balanceAfter, description, conn) {
  const db = conn || { execute: (sql, params) => query(sql, params) };
  await db.execute(
    `INSERT INTO trade_flows (user_id, account_type, order_id, flow_type, amount, balance_before, balance_after, description)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, accountType, orderId, flowType, amount, balanceBefore, balanceAfter, description]
  );
}

module.exports = {
  getOrCreateAccount,
  getAccountOverview,
  freezeMargin,
  releaseMargin,
  deductBalance,
  addBalance,
  settleOrder,
  updateFloatingPnl,
  recordFlow,
};
