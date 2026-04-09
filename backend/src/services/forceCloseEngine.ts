import Decimal from 'decimal.js';
import { prisma } from '../config/database';
import { marketEngine } from './marketEngine';
import { FeeCalculator } from './feeCalculator';
import { TradeEngine } from './tradeEngine';

/**
 * 强平引擎
 * 监控所有持仓用户的保证金比例，触发预警和自动强平
 */
export class ForceCloseEngine {
  private warningRatio = 100;
  private forceCloseRatio = 50;

  /**
   * 加载风控参数配置
   */
  async loadConfig() {
    const configs = await prisma.riskConfig.findMany({
      where: { configKey: { in: ['margin_warning_ratio', 'force_close_ratio'] } },
    });
    for (const cfg of configs) {
      if (cfg.configKey === 'margin_warning_ratio') this.warningRatio = parseFloat(cfg.configValue);
      if (cfg.configKey === 'force_close_ratio') this.forceCloseRatio = parseFloat(cfg.configValue);
    }
  }

  /**
   * 扫描所有持仓用户，检查保证金比例
   * 定时调用（如每 5 秒）
   */
  async scan() {
    await this.loadConfig();

    const accounts = await prisma.fundAccount.findMany({
      where: { usedMargin: { gt: 0 } },
    });

    for (const account of accounts) {
      const usedMargin = new Decimal(account.usedMargin.toString());
      if (usedMargin.isZero()) continue;

      const totalFloatingPnl = await this.calcUserFloatingPnl(account.userId);
      const balance = new Decimal(account.balance.toString());
      const equity = balance.plus(totalFloatingPnl);
      const marginRatio = equity.div(usedMargin).mul(100);

      if (marginRatio.lte(this.forceCloseRatio)) {
        await this.executeForceClose(account.userId, marginRatio);
      } else if (marginRatio.lte(this.warningRatio)) {
        await this.createWarning(account.userId, marginRatio);
      }
    }
  }

  /**
   * 计算用户所有持仓的浮动盈亏总和
   */
  private async calcUserFloatingPnl(userId: number): Promise<Decimal> {
    const positions = await prisma.tradeOrder.findMany({
      where: { userId, status: 'open' },
      include: { symbol: true },
    });

    let total = new Decimal(0);
    const prices = await marketEngine.getCurrentPrice();
    const priceMap = new Map(prices.map((p) => [p.symbol, p]));

    for (const pos of positions) {
      const tick = priceMap.get(pos.symbol.symbol);
      if (!tick) continue;

      const currentPrice = pos.direction === 'buy' ? tick.bid : tick.ask;
      const pnl = FeeCalculator.calcFloatingPnl(
        pos.direction,
        new Decimal(pos.openPrice!.toString()),
        new Decimal(currentPrice),
        pos.symbol.contractUnit,
        new Decimal(pos.lots.toString())
      );
      total = total.plus(pnl);
    }

    return total;
  }

  /**
   * 执行强平 — 按亏损从大到小平仓
   */
  private async executeForceClose(userId: number, marginRatio: Decimal) {
    const positions = await prisma.tradeOrder.findMany({
      where: { userId, status: 'open' },
      include: { symbol: true },
    });

    const prices = await marketEngine.getCurrentPrice();
    const priceMap = new Map(prices.map((p) => [p.symbol, p]));

    const posWithPnl = positions.map((pos) => {
      const tick = priceMap.get(pos.symbol.symbol);
      let pnl = new Decimal(0);
      if (tick) {
        const currentPrice = pos.direction === 'buy' ? tick.bid : tick.ask;
        pnl = FeeCalculator.calcFloatingPnl(
          pos.direction,
          new Decimal(pos.openPrice!.toString()),
          new Decimal(currentPrice),
          pos.symbol.contractUnit,
          new Decimal(pos.lots.toString())
        );
      }
      return { pos, pnl };
    }).sort((a, b) => a.pnl.minus(b.pnl).toNumber());

    for (const { pos, pnl } of posWithPnl) {
      try {
        const tick = priceMap.get(pos.symbol.symbol);
        const closePrice = pos.direction === 'buy' ? tick!.bid : tick!.ask;

        await TradeEngine.closeOrder(userId, pos.id);

        await prisma.forceCloseRecord.create({
          data: {
            userId,
            tradeOrderId: pos.id,
            closePrice: parseFloat(closePrice),
            closedPnl: pnl.toNumber(),
            marginRatio: marginRatio.toNumber(),
            reason: 'auto',
          },
        });

        await prisma.tradeOrder.update({
          where: { id: pos.id },
          data: { closeReason: 'force_close' },
        });

        console.log(`[ForceClose] Auto closed order ${pos.orderNo} for user ${userId}`);
      } catch (err) {
        console.error(`[ForceClose] Failed to close order ${pos.id}:`, err);
      }
    }
  }

  /**
   * 创建保证金预警通知
   */
  private async createWarning(userId: number, marginRatio: Decimal) {
    const recent = await prisma.riskAlert.findFirst({
      where: {
        userId,
        alertType: 'margin_warning',
        createdAt: { gte: new Date(Date.now() - 3600000) },
      },
    });
    if (recent) return;

    await prisma.riskAlert.create({
      data: {
        userId,
        alertType: 'margin_warning',
        alertLevel: marginRatio.lte(60) ? 'critical' : 'high',
        marginRatio: marginRatio.toNumber(),
        description: `保证金比例 ${marginRatio.toFixed(2)}%，低于预警线 ${this.warningRatio}%`,
      },
    });
  }
}

export const forceCloseEngine = new ForceCloseEngine();
