const { query } = require('../config/database');

async function getTradeReport(userId, { accountType = 'demo', startDate, endDate }) {
  const conditions = ['user_id = ?', 'account_type = ?', "status = 'closed'"];
  const params = [userId, accountType];
  if (startDate) { conditions.push('closed_at >= ?'); params.push(startDate); }
  if (endDate) { conditions.push('closed_at <= ?'); params.push(endDate + ' 23:59:59'); }
  const where = `WHERE ${conditions.join(' AND ')}`;

  const summary = await query(
    `SELECT
       COUNT(*) as totalOrders,
       COALESCE(SUM(lots), 0) as totalLots,
       COALESCE(SUM(CASE WHEN net_pnl > 0 THEN 1 ELSE 0 END), 0) as winCount,
       COALESCE(SUM(net_pnl), 0) as totalPnl
     FROM trade_orders ${where}`, params
  );
  const s = summary[0];
  const winRate = s.totalOrders > 0 ? parseFloat(((s.winCount / s.totalOrders) * 100).toFixed(2)) : 0;

  const trend = await query(
    `SELECT DATE(closed_at) as date, COUNT(*) as orders, COALESCE(SUM(lots), 0) as lots, COALESCE(SUM(net_pnl), 0) as pnl
     FROM trade_orders ${where}
     GROUP BY DATE(closed_at) ORDER BY date ASC`,
    params
  );

  return {
    totalOrders: s.totalOrders,
    totalLots: parseFloat(s.totalLots),
    winRate,
    totalPnl: parseFloat(s.totalPnl),
    dailyTrend: trend.map(t => ({
      date: t.date, orders: t.orders,
      lots: parseFloat(t.lots), pnl: parseFloat(t.pnl),
    })),
  };
}

async function getPnlReport(userId, { accountType = 'demo', startDate, endDate }) {
  const conditions = ['user_id = ?', 'account_type = ?', "status = 'closed'"];
  const params = [userId, accountType];
  if (startDate) { conditions.push('closed_at >= ?'); params.push(startDate); }
  if (endDate) { conditions.push('closed_at <= ?'); params.push(endDate + ' 23:59:59'); }
  const where = `WHERE ${conditions.join(' AND ')}`;

  const summary = await query(
    `SELECT
       COALESCE(SUM(net_pnl), 0) as totalPnl,
       COALESCE(SUM(CASE WHEN net_pnl > 0 THEN net_pnl ELSE 0 END), 0) as totalProfit,
       COALESCE(SUM(CASE WHEN net_pnl < 0 THEN net_pnl ELSE 0 END), 0) as totalLoss,
       COALESCE(AVG(net_pnl), 0) as avgPnl,
       COUNT(*) as totalOrders
     FROM trade_orders ${where}`, params
  );

  const bySymbol = await query(
    `SELECT symbol, COUNT(*) as orders,
       COALESCE(SUM(net_pnl), 0) as pnl,
       COALESCE(SUM(lots), 0) as lots
     FROM trade_orders ${where}
     GROUP BY symbol ORDER BY pnl DESC`,
    params
  );

  const s = summary[0];
  return {
    totalPnl: parseFloat(s.totalPnl),
    totalProfit: parseFloat(s.totalProfit),
    totalLoss: parseFloat(s.totalLoss),
    avgPnl: parseFloat(parseFloat(s.avgPnl).toFixed(4)),
    totalOrders: s.totalOrders,
    bySymbol: bySymbol.map(b => ({
      symbol: b.symbol, orders: b.orders,
      pnl: parseFloat(b.pnl), lots: parseFloat(b.lots),
    })),
  };
}

async function getFeesReport(userId, { accountType = 'demo', startDate, endDate }) {
  const conditions = ['user_id = ?', 'account_type = ?', "status = 'closed'"];
  const params = [userId, accountType];
  if (startDate) { conditions.push('closed_at >= ?'); params.push(startDate); }
  if (endDate) { conditions.push('closed_at <= ?'); params.push(endDate + ' 23:59:59'); }
  const where = `WHERE ${conditions.join(' AND ')}`;

  const summary = await query(
    `SELECT
       COALESCE(SUM(spread_cost), 0) as totalSpread,
       COALESCE(SUM(commission + commission_close), 0) as totalCommission,
       COALESCE(SUM(ABS(swap_total)), 0) as totalSwap
     FROM trade_orders ${where}`, params
  );

  const daily = await query(
    `SELECT DATE(closed_at) as date,
       COALESCE(SUM(spread_cost), 0) as spread,
       COALESCE(SUM(commission + commission_close), 0) as commission,
       COALESCE(SUM(ABS(swap_total)), 0) as swap
     FROM trade_orders ${where}
     GROUP BY DATE(closed_at) ORDER BY date ASC`,
    params
  );

  const s = summary[0];
  const totalFees = parseFloat(s.totalSpread) + parseFloat(s.totalCommission) + parseFloat(s.totalSwap);
  return {
    totalFees: parseFloat(totalFees.toFixed(4)),
    totalSpread: parseFloat(s.totalSpread),
    totalCommission: parseFloat(s.totalCommission),
    totalSwap: parseFloat(s.totalSwap),
    daily: daily.map(d => ({
      date: d.date,
      spread: parseFloat(d.spread),
      commission: parseFloat(d.commission),
      swap: parseFloat(d.swap),
      total: parseFloat((parseFloat(d.spread) + parseFloat(d.commission) + parseFloat(d.swap)).toFixed(4)),
    })),
  };
}

async function getOperationsOverview({ startDate, endDate }) {
  const dateCondition = [];
  const params = [];
  if (startDate) { dateCondition.push('created_at >= ?'); params.push(startDate); }
  if (endDate) { dateCondition.push('created_at <= ?'); params.push(endDate + ' 23:59:59'); }
  const dateWhere = dateCondition.length > 0 ? `AND ${dateCondition.join(' AND ')}` : '';

  const result = await query(`
    SELECT
      (SELECT COUNT(*) FROM users WHERE 1=1 ${dateWhere.replace(/created_at/g, 'users.created_at')}) as newUsers,
      (SELECT COALESCE(SUM(amount), 0) FROM deposits WHERE status = 'completed' ${dateWhere.replace(/created_at/g, 'deposits.created_at')}) as totalDeposit,
      (SELECT COALESCE(SUM(amount), 0) FROM withdraws WHERE status = 'completed' ${dateWhere.replace(/created_at/g, 'withdraws.created_at')}) as totalWithdraw,
      (SELECT COALESCE(SUM(commission + commission_close), 0) FROM trade_orders WHERE status = 'closed' ${dateWhere.replace(/created_at/g, 'trade_orders.created_at')}) as totalCommission
  `, [...params, ...params, ...params, ...params]);

  const trend = await query(
    `SELECT DATE(d.created_at) as date,
       COALESCE(SUM(d.amount), 0) as deposit
     FROM deposits d
     WHERE d.status = 'completed' ${dateWhere.replace(/created_at/g, 'd.created_at')}
     GROUP BY DATE(d.created_at) ORDER BY date ASC`,
    params
  );

  const r = result[0];
  return {
    newUsers: r.newUsers,
    totalDeposit: parseFloat(r.totalDeposit),
    totalWithdraw: parseFloat(r.totalWithdraw),
    totalCommission: parseFloat(r.totalCommission),
    trend: trend.map(t => ({ date: t.date, deposit: parseFloat(t.deposit) })),
  };
}

async function getRiskReport({ startDate, endDate } = {}) {
  const dateCond = [];
  const dateParams = [];
  if (startDate) { dateCond.push('closed_at >= ?'); dateParams.push(startDate); }
  if (endDate) { dateCond.push('closed_at <= ?'); dateParams.push(endDate + ' 23:59:59'); }
  const dateWhere = dateCond.length > 0 ? `AND ${dateCond.join(' AND ')}` : '';

  const acctDateCond = [];
  const acctDateParams = [];
  if (startDate) { acctDateCond.push('updated_at >= ?'); acctDateParams.push(startDate); }
  if (endDate) { acctDateCond.push('updated_at <= ?'); acctDateParams.push(endDate + ' 23:59:59'); }
  const acctDateWhere = acctDateCond.length > 0 ? `AND ${acctDateCond.join(' AND ')}` : '';

  const warnings = await query(
    `SELECT COUNT(*) as cnt FROM fund_accounts
     WHERE status = 'active' AND frozen_margin > 0
     AND ((balance + floating_pnl) / frozen_margin * 100) < 50 ${acctDateWhere}`,
    acctDateParams
  );

  const forceClose = await query(
    `SELECT COUNT(*) as cnt FROM trade_orders
     WHERE close_type = 'force_close' AND status = 'closed' ${dateWhere}`,
    dateParams
  );
  return {
    warningCount: warnings[0].cnt,
    forceCloseCount: forceClose[0].cnt,
    riskDistribution: [
      { level: '低风险', count: 0 },
      { level: '中风险', count: warnings[0].cnt },
      { level: '高风险', count: forceClose[0].cnt },
    ],
  };
}

async function getUserAnalysis({ startDate, endDate } = {}) {
  const dateCond = [];
  const dateParams = [];
  if (startDate) { dateCond.push('created_at >= ?'); dateParams.push(startDate); }
  if (endDate) { dateCond.push('created_at <= ?'); dateParams.push(endDate + ' 23:59:59'); }
  const dateWhere = dateCond.length > 0 ? `AND ${dateCond.join(' AND ')}` : '';

  const hasDateFilter = startDate || endDate;

  let pnlDist;
  if (hasDateFilter) {
    pnlDist = await query(
      `SELECT
         SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END) as profitUsers,
         SUM(CASE WHEN pnl < 0 THEN 1 ELSE 0 END) as lossUsers,
         SUM(CASE WHEN pnl = 0 THEN 1 ELSE 0 END) as evenUsers
       FROM (
         SELECT user_id, SUM(COALESCE(net_pnl, 0)) as pnl
         FROM trade_orders
         WHERE status = 'closed' AND account_type = 'real' ${dateWhere.replace(/created_at/g, 'closed_at')}
         GROUP BY user_id
       ) t`,
      dateParams
    );
  } else {
    pnlDist = await query(
      `SELECT
         SUM(CASE WHEN total_profit > 0 THEN 1 ELSE 0 END) as profitUsers,
         SUM(CASE WHEN total_profit < 0 THEN 1 ELSE 0 END) as lossUsers,
         SUM(CASE WHEN total_profit = 0 THEN 1 ELSE 0 END) as evenUsers
       FROM fund_accounts WHERE account_type = 'real'`
    );
  }

  let topTraders;
  if (hasDateFilter) {
    topTraders = await query(
      `SELECT u.id, u.email, u.nickname,
         COALESCE(SUM(o.net_pnl), 0) as total_profit,
         fa.balance, fa.total_deposit
       FROM trade_orders o
       JOIN users u ON o.user_id = u.id
       JOIN fund_accounts fa ON o.user_id = fa.user_id AND fa.account_type = 'real'
       WHERE o.status = 'closed' AND o.account_type = 'real' ${dateWhere.replace(/created_at/g, 'o.closed_at')}
       GROUP BY o.user_id
       ORDER BY total_profit DESC LIMIT 10`,
      dateParams
    );
  } else {
    topTraders = await query(
      `SELECT u.id, u.email, u.nickname, fa.total_profit, fa.balance, fa.total_deposit
       FROM fund_accounts fa
       JOIN users u ON fa.user_id = u.id
       WHERE fa.account_type = 'real'
       ORDER BY fa.total_profit DESC LIMIT 10`
    );
  }

  const activeUsers = await query(
    `SELECT COUNT(DISTINCT user_id) as cnt FROM trade_orders
     WHERE 1=1 ${dateWhere || 'AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)'}`,
    dateParams
  );

  const d = pnlDist[0];
  return {
    pnlDistribution: {
      profitUsers: d.profitUsers || 0,
      lossUsers: d.lossUsers || 0,
      evenUsers: d.evenUsers || 0,
    },
    topTraders: topTraders.map(t => ({
      id: t.id, email: t.email, nickname: t.nickname,
      totalProfit: parseFloat(t.total_profit),
      balance: parseFloat(t.balance),
      totalDeposit: parseFloat(t.total_deposit),
    })),
    weeklyActiveUsers: activeUsers[0].cnt,
  };
}

module.exports = {
  getTradeReport,
  getPnlReport,
  getFeesReport,
  getOperationsOverview,
  getRiskReport,
  getUserAnalysis,
};
