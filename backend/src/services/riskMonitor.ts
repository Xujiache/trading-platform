import Decimal from 'decimal.js';
import { prisma } from '../config/database';

/**
 * 风控监控器
 * 检测反洗钱（AML）可疑交易、大额交易等异常行为
 */
export class RiskMonitor {
  /**
   * 扫描大额交易（单笔超过一定阈值）
   */
  async scanLargeTransactions() {
    const threshold = 100000;

    const largeDeposits = await prisma.depositOrder.findMany({
      where: {
        amount: { gte: threshold },
        createdAt: { gte: new Date(Date.now() - 86400000) },
      },
      include: { user: { select: { id: true, phone: true, nickname: true } } },
    });

    for (const deposit of largeDeposits) {
      const exists = await prisma.riskAlert.findFirst({
        where: {
          userId: deposit.userId,
          alertType: 'large_trade',
          createdAt: { gte: new Date(Date.now() - 3600000) },
        },
      });
      if (exists) continue;

      await prisma.riskAlert.create({
        data: {
          userId: deposit.userId,
          alertType: 'large_trade',
          alertLevel: 'medium',
          description: `大额入金 ¥${deposit.amount}`,
        },
      });
    }
  }

  /**
   * 扫描 AML 可疑行为（短时间内频繁入出金）
   */
  async scanAmlSuspicious() {
    const timeWindow = 3600000;
    const threshold = 3;

    const users = await prisma.user.findMany({
      where: { status: 1 },
      select: { id: true },
    });

    for (const user of users) {
      const recentFlows = await prisma.fundFlow.count({
        where: {
          userId: user.id,
          flowType: { in: ['deposit', 'withdraw'] },
          createdAt: { gte: new Date(Date.now() - timeWindow) },
        },
      });

      if (recentFlows >= threshold) {
        const exists = await prisma.riskAlert.findFirst({
          where: {
            userId: user.id,
            alertType: 'aml_suspicious',
            createdAt: { gte: new Date(Date.now() - timeWindow) },
          },
        });
        if (exists) continue;

        await prisma.riskAlert.create({
          data: {
            userId: user.id,
            alertType: 'aml_suspicious',
            alertLevel: 'high',
            description: `1小时内频繁入出金 ${recentFlows} 次`,
          },
        });
      }
    }
  }
}

export const riskMonitor = new RiskMonitor();
