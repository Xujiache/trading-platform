import { prisma } from '../../config/database';
import { parsePagination } from '../../utils/helpers';
import Decimal from 'decimal.js';

// ==================== 移动端报表 ====================

/**
 * 用户交易报表
 * @param userId - 用户 ID
 * @param dateRange - 日期范围（可选）
 */
export async function getUserTradeReport(userId: number, dateRange?: { startDate?: string; endDate?: string }) {
  const where: Record<string, unknown> = { userId, status: 'closed' };
  if (dateRange?.startDate || dateRange?.endDate) {
    where.closedAt = {};
    if (dateRange.startDate) (where.closedAt as Record<string, unknown>).gte = new Date(dateRange.startDate);
    if (dateRange.endDate) (where.closedAt as Record<string, unknown>).lte = new Date(dateRange.endDate);
  }

  const orders = await prisma.tradeOrder.findMany({
    where,
    include: { symbol: { select: { symbol: true, name: true } } },
    orderBy: { closedAt: 'desc' },
  });

  const totalTrades = orders.length;
  const winTrades = orders.filter((o) => new Decimal(o.closedPnl?.toString() || '0').gt(0)).length;
  const totalPnl = orders.reduce((sum, o) => sum.plus(o.closedPnl?.toString() || '0'), new Decimal(0));
  const totalLots = orders.reduce((sum, o) => sum.plus(o.lots.toString()), new Decimal(0));

  return {
    totalTrades,
    winTrades,
    lossTrades: totalTrades - winTrades,
    winRate: totalTrades > 0 ? ((winTrades / totalTrades) * 100).toFixed(1) : '0',
    totalPnl: totalPnl.toFixed(2),
    totalLots: totalLots.toFixed(2),
    orders: orders.slice(0, 50),
  };
}

/**
 * 用户盈亏报表
 */
export async function getUserPnlReport(userId: number) {
  const account = await prisma.fundAccount.findUnique({ where: { userId } });
  const closedOrders = await prisma.tradeOrder.findMany({
    where: { userId, status: 'closed' },
    select: { closedPnl: true, closedAt: true },
    orderBy: { closedAt: 'desc' },
    take: 30,
  });

  return {
    totalPnl: account?.totalPnl.toString() || '0',
    totalCommission: account?.totalCommission.toString() || '0',
    totalSwap: account?.totalSwap.toString() || '0',
    netProfit: new Decimal(account?.totalPnl.toString() || '0')
      .minus(account?.totalCommission.toString() || '0')
      .minus(account?.totalSwap.toString() || '0')
      .toFixed(2),
    recentPnl: closedOrders.map((o) => ({
      pnl: o.closedPnl?.toString() || '0',
      date: o.closedAt?.toISOString(),
    })),
  };
}

/**
 * 用户费用报表
 */
export async function getUserFeeReport(userId: number) {
  const account = await prisma.fundAccount.findUnique({ where: { userId } });

  return {
    totalCommission: account?.totalCommission.toString() || '0',
    totalSwap: account?.totalSwap.toString() || '0',
    totalFees: new Decimal(account?.totalCommission.toString() || '0')
      .plus(account?.totalSwap.toString() || '0')
      .toFixed(2),
  };
}

// ==================== 管理端报表 ====================

/**
 * Dashboard 数据看板
 */
export async function getDashboardData() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalUsers,
    todayUsers,
    totalDeposit,
    todayDeposit,
    totalWithdraw,
    todayTrades,
    totalTrades,
    totalPnl,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: today } } }),
    prisma.depositOrder.aggregate({ where: { status: 'approved' }, _sum: { amount: true } }),
    prisma.depositOrder.aggregate({ where: { status: 'approved', reviewedAt: { gte: today } }, _sum: { amount: true } }),
    prisma.withdrawOrder.aggregate({ where: { status: 'completed' }, _sum: { amount: true } }),
    prisma.tradeOrder.count({ where: { createdAt: { gte: today } } }),
    prisma.tradeOrder.count(),
    prisma.tradeOrder.aggregate({ where: { status: 'closed' }, _sum: { closedPnl: true } }),
  ]);

  return {
    totalUsers,
    todayUsers,
    totalDeposit: totalDeposit._sum.amount?.toString() || '0',
    todayDeposit: todayDeposit._sum.amount?.toString() || '0',
    totalWithdraw: totalWithdraw._sum.amount?.toString() || '0',
    todayTrades,
    totalTrades,
    totalPnl: totalPnl._sum.closedPnl?.toString() || '0',
  };
}

/**
 * 运营报表
 */
export async function getOperationReport(query: { startDate?: string; endDate?: string }) {
  const where: Record<string, unknown> = {};
  if (query.startDate || query.endDate) {
    where.createdAt = {};
    if (query.startDate) (where.createdAt as Record<string, unknown>).gte = new Date(query.startDate);
    if (query.endDate) (where.createdAt as Record<string, unknown>).lte = new Date(query.endDate);
  }

  const [newUsers, deposits, withdraws, trades] = await Promise.all([
    prisma.user.count({ where }),
    prisma.depositOrder.aggregate({ where: { ...where, status: 'approved' }, _sum: { amount: true }, _count: true }),
    prisma.withdrawOrder.aggregate({ where: { ...where, status: 'completed' }, _sum: { amount: true }, _count: true }),
    prisma.tradeOrder.count({ where }),
  ]);

  return {
    newUsers,
    depositAmount: deposits._sum.amount?.toString() || '0',
    depositCount: deposits._count || 0,
    withdrawAmount: withdraws._sum.amount?.toString() || '0',
    withdrawCount: withdraws._count || 0,
    tradeCount: trades,
  };
}

/**
 * 风控报表
 */
export async function getRiskReport() {
  const [alertCount, forceCloseCount, highRiskCount] = await Promise.all([
    prisma.riskAlert.count({ where: { status: 'pending' } }),
    prisma.forceCloseRecord.count(),
    prisma.fundAccount.count({ where: { usedMargin: { gt: 0 } } }),
  ]);

  return { pendingAlerts: alertCount, totalForceClose: forceCloseCount, accountsWithPositions: highRiskCount };
}

/**
 * 用户分析
 */
export async function getUserAnalysis() {
  const kycStats = await prisma.user.groupBy({ by: ['kycStatus'], _count: true });
  const levelStats = await prisma.user.groupBy({ by: ['userLevelId'], _count: true });
  const totalUsers = await prisma.user.count();
  const activeUsers = await prisma.user.count({ where: { lastLoginAt: { gte: new Date(Date.now() - 7 * 86400000) } } });

  return {
    totalUsers,
    activeUsers7d: activeUsers,
    kycDistribution: kycStats.map((s) => ({ status: s.kycStatus, count: s._count })),
    levelDistribution: levelStats.map((s) => ({ levelId: s.userLevelId, count: s._count })),
  };
}
