import { Queue, Worker } from 'bullmq';
import { redis } from '../config/redis';
import { prisma } from '../config/database';
import { config } from '../config';
import Decimal from 'decimal.js';

const connection = { host: config.redis.host, port: config.redis.port, password: config.redis.password };

/**
 * 隔夜费结算队列 — 每日凌晨 5:00（北京时间）执行
 * 周三收取 3 倍（覆盖周六日）
 */
export const overnightFeeQueue = new Queue('overnightFee', { connection });

/**
 * 启动隔夜费结算 Worker
 * 公式: (合约单位 × 手数 × 结算价 × 隔夜费利率) / 360
 */
export function startOvernightFeeWorker() {
  const worker = new Worker('overnightFee', async () => {
    const openOrders = await prisma.tradeOrder.findMany({
      where: { status: 'open' },
      include: { symbol: true },
    });

    const dayOfWeek = new Date().getDay();
    const isTripleDay = dayOfWeek === 3;
    const multiplier = isTripleDay ? 3 : 1;

    for (const order of openOrders) {
      try {
        const priceData = await redis.hget('market:prices', order.symbol.symbol);
        if (!priceData) continue;

        const tick = JSON.parse(priceData);
        const settlePrice = new Decimal(tick.last);
        const lots = new Decimal(order.lots.toString());
        const contractUnit = order.symbol.contractUnit;

        const swapRate = order.direction === 'buy'
          ? new Decimal(order.symbol.swapLong.toString())
          : new Decimal(order.symbol.swapShort.toString());

        const swapFee = new Decimal(contractUnit)
          .mul(lots)
          .mul(settlePrice)
          .mul(swapRate)
          .div(360)
          .mul(multiplier);

        const roundedFee = swapFee.toDecimalPlaces(2);

        await prisma.$transaction(async (tx) => {
          await tx.tradeOrder.update({
            where: { id: order.id },
            data: { swap: { increment: roundedFee.toNumber() } },
          });

          const account = await tx.fundAccount.findUnique({ where: { userId: order.userId } });
          if (!account) return;

          const balanceBefore = new Decimal(account.balance.toString());
          const balanceAfter = balanceBefore.minus(roundedFee.abs());

          await tx.fundAccount.update({
            where: { userId: order.userId },
            data: {
              balance: balanceAfter.toNumber(),
              totalSwap: { increment: roundedFee.abs().toNumber() },
            },
          });

          await tx.fundFlow.create({
            data: {
              userId: order.userId,
              flowType: 'swap',
              amount: roundedFee.negated().toNumber(),
              balanceBefore: balanceBefore.toNumber(),
              balanceAfter: balanceAfter.toNumber(),
              refType: 'trade_order',
              refId: order.id,
              remark: `隔夜费结算${isTripleDay ? '(三倍)' : ''}`,
            },
          });
        });
      } catch (err) {
        console.error(`[OvernightFeeQueue] Order ${order.id} settle failed:`, err);
      }
    }

    console.log(`[OvernightFeeQueue] Settled ${openOrders.length} orders`);
  }, { connection });

  worker.on('error', (err) => console.error('[OvernightFeeQueue] Worker error:', err));
}
