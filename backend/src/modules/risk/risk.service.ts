import { prisma } from '../../config/database';
import { NotFoundError, ValidationError } from '../../utils/errors';
import { parsePagination } from '../../utils/helpers';
import Decimal from 'decimal.js';
import { marketEngine } from '../../services/marketEngine';
import { FeeCalculator } from '../../services/feeCalculator';
import type { RiskAssessmentInput, ProcessAlertInput } from './risk.schema';

// ==================== 用户端 ====================

/**
 * 提交风险测评
 */
export async function submitAssessment(userId: number, input: RiskAssessmentInput) {
  const totalScore = input.answers.reduce((sum, a) => sum + a.score, 0);
  let riskLevel = 'conservative';
  if (totalScore >= 70) riskLevel = 'aggressive';
  else if (totalScore >= 40) riskLevel = 'moderate';

  await prisma.riskAssessment.create({
    data: { userId, answers: input.answers, score: totalScore, riskLevel },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { riskLevel },
  });

  return { score: totalScore, riskLevel };
}

/**
 * 查询测评结果
 */
export async function getAssessment(userId: number) {
  const latest = await prisma.riskAssessment.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
  return latest || { score: 0, riskLevel: null, message: '尚未完成风险测评' };
}

/**
 * 用户风险状态
 */
export async function getRiskStatus(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { riskLevel: true },
  });
  const account = await prisma.fundAccount.findUnique({ where: { userId } });

  let marginRatio = '0';
  if (account) {
    const usedMargin = new Decimal(account.usedMargin.toString());
    if (!usedMargin.isZero()) {
      const balance = new Decimal(account.balance.toString());
      const floatingPnl = new Decimal(account.floatingPnl.toString());
      marginRatio = balance.plus(floatingPnl).div(usedMargin).mul(100).toFixed(2);
    }
  }

  return { riskLevel: user?.riskLevel || null, marginRatio };
}

// ==================== 管理端 ====================

/**
 * 获取风控参数配置
 */
export async function getRiskConfig() {
  return prisma.riskConfig.findMany({ orderBy: { category: 'asc' } });
}

/**
 * 更新风控参数
 */
export async function updateRiskConfig(configs: Array<{ configKey: string; configValue: string; description?: string }>) {
  for (const cfg of configs) {
    await prisma.riskConfig.upsert({
      where: { configKey: cfg.configKey },
      update: { configValue: cfg.configValue, description: cfg.description },
      create: { configKey: cfg.configKey, configValue: cfg.configValue, description: cfg.description },
    });
  }
  return { message: '风控参数已更新' };
}

/**
 * 风险预警列表
 */
export async function getAlerts(query: { page?: number; limit?: number; status?: string; alertType?: string }) {
  const { skip, take, page, limit } = parsePagination(query.page, query.limit);
  const where: Record<string, unknown> = {};
  if (query.status) where.status = query.status;
  if (query.alertType) where.alertType = query.alertType;

  const [list, total] = await Promise.all([
    prisma.riskAlert.findMany({
      where, skip, take,
      include: { user: { select: { phone: true, nickname: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.riskAlert.count({ where }),
  ]);
  return { list, total, page, limit };
}

/**
 * 处理预警
 */
export async function processAlert(alertId: number, adminId: number, input: ProcessAlertInput) {
  const alert = await prisma.riskAlert.findUnique({ where: { id: alertId } });
  if (!alert) throw new NotFoundError('预警不存在');

  return prisma.riskAlert.update({
    where: { id: alertId },
    data: {
      status: input.status,
      processedBy: adminId,
      processedAt: new Date(),
      processRemark: input.processRemark,
    },
  });
}

/**
 * 强平记录列表
 */
export async function getForceCloseRecords(query: { page?: number; limit?: number }) {
  const { skip, take, page, limit } = parsePagination(query.page, query.limit);
  const [list, total] = await Promise.all([
    prisma.forceCloseRecord.findMany({
      skip, take,
      include: {
        user: { select: { phone: true, nickname: true } },
        tradeOrder: { select: { orderNo: true, direction: true, lots: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.forceCloseRecord.count(),
  ]);
  return { list, total, page, limit };
}

/**
 * 高风险账户监控
 */
export async function getHighRiskAccounts() {
  const accounts = await prisma.fundAccount.findMany({
    where: { usedMargin: { gt: 0 } },
    include: { user: { select: { id: true, phone: true, nickname: true } } },
  });

  const prices = await marketEngine.getCurrentPrice();
  const priceMap = new Map(prices.map((p) => [p.symbol, p]));

  const result = [];
  for (const account of accounts) {
    const usedMargin = new Decimal(account.usedMargin.toString());
    if (usedMargin.isZero()) continue;

    const positions = await prisma.tradeOrder.findMany({
      where: { userId: account.userId, status: 'open' },
      include: { symbol: true },
    });

    let totalPnl = new Decimal(0);
    for (const pos of positions) {
      const tick = priceMap.get(pos.symbol.symbol);
      if (!tick) continue;
      const currentPrice = pos.direction === 'buy' ? tick.bid : tick.ask;
      totalPnl = totalPnl.plus(FeeCalculator.calcFloatingPnl(
        pos.direction,
        new Decimal(pos.openPrice!.toString()),
        new Decimal(currentPrice),
        pos.symbol.contractUnit,
        new Decimal(pos.lots.toString())
      ));
    }

    const equity = new Decimal(account.balance.toString()).plus(totalPnl);
    const marginRatio = equity.div(usedMargin).mul(100);

    if (marginRatio.lte(150)) {
      result.push({
        userId: account.userId,
        user: account.user,
        balance: account.balance.toString(),
        usedMargin: usedMargin.toFixed(2),
        floatingPnl: totalPnl.toFixed(2),
        equity: equity.toFixed(2),
        marginRatio: marginRatio.toFixed(2),
        positionCount: positions.length,
      });
    }
  }

  return result.sort((a, b) => parseFloat(a.marginRatio) - parseFloat(b.marginRatio));
}
