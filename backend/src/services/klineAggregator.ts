import Decimal from 'decimal.js';
import { prisma } from '../config/database';
import { redis } from '../config/redis';

interface KlineBar {
  open: Decimal;
  high: Decimal;
  low: Decimal;
  close: Decimal;
  volume: Decimal;
  openTime: Date;
}

const PERIODS = ['1m', '5m', '15m', '30m', '1h', '4h', '1d'] as const;

/**
 * K 线聚合器
 * 将实时 tick 数据聚合为多周期 K 线，并定期持久化到数据库
 */
export class KlineAggregator {
  private currentBars: Map<string, KlineBar> = new Map();

  /**
   * 接收 tick 数据，更新当前 1 分钟 K 线
   * @param symbol - 品种代码
   * @param price - 最新价
   * @param volume - 成交量增量
   */
  updateTick(symbol: string, price: string, volume: string) {
    const key = `${symbol}:1m`;
    const priceDecimal = new Decimal(price);
    const volumeDecimal = new Decimal(volume);

    const bar = this.currentBars.get(key);
    if (!bar) {
      const now = new Date();
      now.setSeconds(0, 0);
      this.currentBars.set(key, {
        open: priceDecimal,
        high: priceDecimal,
        low: priceDecimal,
        close: priceDecimal,
        volume: volumeDecimal,
        openTime: now,
      });
      return;
    }

    bar.close = priceDecimal;
    if (priceDecimal.gt(bar.high)) bar.high = priceDecimal;
    if (priceDecimal.lt(bar.low)) bar.low = priceDecimal;
    bar.volume = bar.volume.plus(volumeDecimal);
  }

  /**
   * 完成当前 K 线周期，持久化到数据库并推入 Redis
   * 每分钟由定时任务调用
   */
  async flushBars() {
    const symbolMap = await this.getSymbolIdMap();

    for (const [key, bar] of this.currentBars.entries()) {
      const [symbol, period] = key.split(':');
      const symbolId = symbolMap.get(symbol);
      if (!symbolId) continue;

      try {
        await prisma.klineHistory.upsert({
          where: {
            symbolId_period_openTime: {
              symbolId,
              period,
              openTime: bar.openTime,
            },
          },
          update: {
            high: bar.high.toFixed(4),
            low: bar.low.toFixed(4),
            close: bar.close.toFixed(4),
            volume: bar.volume.toFixed(2),
          },
          create: {
            symbolId,
            period,
            openTime: bar.openTime,
            open: bar.open.toFixed(4),
            high: bar.high.toFixed(4),
            low: bar.low.toFixed(4),
            close: bar.close.toFixed(4),
            volume: bar.volume.toFixed(2),
          },
        });

        await redis.set(
          `kline:${symbol}:${period}:latest`,
          JSON.stringify({
            open: bar.open.toFixed(4),
            high: bar.high.toFixed(4),
            low: bar.low.toFixed(4),
            close: bar.close.toFixed(4),
            volume: bar.volume.toFixed(2),
            time: bar.openTime.getTime(),
          })
        );
      } catch (err) {
        console.error(`[KlineAggregator] Failed to flush ${key}:`, err);
      }
    }

    this.currentBars.clear();
  }

  /**
   * 获取品种代码到 ID 的映射
   */
  private async getSymbolIdMap(): Promise<Map<string, number>> {
    const symbols = await prisma.tradingSymbol.findMany({
      where: { status: 1 },
      select: { id: true, symbol: true },
    });
    return new Map(symbols.map((s) => [s.symbol, s.id]));
  }

  /**
   * 生成初始历史 K 线数据（首次启动时调用）
   * @param symbol - 品种代码
   * @param symbolId - 品种 ID
   * @param basePrice - 基准价格
   * @param count - 生成条数
   */
  async generateHistoryKlines(symbol: string, symbolId: number, basePrice: number, count = 200) {
    const existing = await prisma.klineHistory.count({
      where: { symbolId, period: '1m' },
    });
    if (existing >= count) return;

    const precision = symbol === 'XAGUSD' ? 4 : 2;
    let price = new Decimal(basePrice);
    const now = new Date();
    const bars: Array<{
      symbolId: number;
      period: string;
      openTime: Date;
      open: Decimal;
      high: Decimal;
      low: Decimal;
      close: Decimal;
      volume: Decimal;
    }> = [];

    for (let i = count; i > 0; i--) {
      const openTime = new Date(now.getTime() - i * 60000);
      openTime.setSeconds(0, 0);

      const change = (Math.random() - 0.5) * basePrice * 0.002;
      const open = price;
      const close = price.plus(change);
      const high = Decimal.max(open, close).plus(Math.abs(change) * Math.random());
      const low = Decimal.min(open, close).minus(Math.abs(change) * Math.random());
      const volume = new Decimal(Math.floor(Math.random() * 100 + 10));

      bars.push({ symbolId, period: '1m', openTime, open, high, low, close, volume });
      price = close;
    }

    for (const bar of bars) {
      await prisma.klineHistory.upsert({
        where: {
          symbolId_period_openTime: {
            symbolId: bar.symbolId,
            period: bar.period,
            openTime: bar.openTime,
          },
        },
        update: {},
        create: {
          symbolId: bar.symbolId,
          period: bar.period,
          openTime: bar.openTime,
          open: bar.open.toFixed(precision),
          high: bar.high.toFixed(precision),
          low: bar.low.toFixed(precision),
          close: bar.close.toFixed(precision),
          volume: bar.volume.toFixed(2),
        },
      });
    }

    console.log(`[KlineAggregator] Generated ${bars.length} history klines for ${symbol}`);
  }
}

export const klineAggregator = new KlineAggregator();
