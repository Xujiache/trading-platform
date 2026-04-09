import Decimal from 'decimal.js';
import { redis } from '../config/redis';
import { prisma } from '../config/database';

export interface TickData {
  symbol: string;
  bid: string;
  ask: string;
  high: string;
  low: string;
  open: string;
  last: string;
  change: string;
  changePercent: string;
  volume: string;
  timestamp: number;
}

const BASE_PRICES: Record<string, { price: number; volatility: number; spread: number }> = {
  XAUUSD: { price: 2650.00, volatility: 0.0008, spread: 3.5 },
  XAGUSD: { price: 31.50, volatility: 0.0012, spread: 0.03 },
  WTIUSD: { price: 72.80, volatility: 0.0015, spread: 0.05 },
};

/**
 * 行情引擎
 * 使用价格随机游走模型生成模拟行情数据
 * 实际生产环境应替换为真实数据源（如新浪 API、路透社等）
 */
export class MarketEngine {
  private prices: Map<string, { bid: Decimal; ask: Decimal; high: Decimal; low: Decimal; open: Decimal; volume: Decimal }> = new Map();
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private tickCallback: ((tick: TickData) => void) | null = null;

  constructor() {
    this.initPrices();
  }

  /**
   * 初始化各品种基准价格
   */
  private initPrices() {
    for (const [symbol, config] of Object.entries(BASE_PRICES)) {
      const basePrice = new Decimal(config.price);
      const halfSpread = new Decimal(config.spread).div(2);
      this.prices.set(symbol, {
        bid: basePrice.minus(halfSpread),
        ask: basePrice.plus(halfSpread),
        high: basePrice.plus(basePrice.mul(0.005)),
        low: basePrice.minus(basePrice.mul(0.005)),
        open: basePrice,
        volume: new Decimal(Math.floor(Math.random() * 10000 + 5000)),
      });
    }
  }

  /**
   * 注册行情推送回调
   * @param callback - 每次 tick 更新时调用
   */
  onTick(callback: (tick: TickData) => void) {
    this.tickCallback = callback;
  }

  /**
   * 启动行情引擎，每秒更新一次价格
   */
  start() {
    if (this.intervalId) return;

    this.intervalId = setInterval(() => {
      for (const [symbol, config] of Object.entries(BASE_PRICES)) {
        const priceData = this.prices.get(symbol);
        if (!priceData) continue;

        const change = this.generatePriceChange(config.volatility);
        const midPrice = priceData.bid.plus(priceData.ask).div(2);
        const newMid = midPrice.plus(midPrice.mul(change));
        const halfSpread = new Decimal(config.spread).div(2);

        const newBid = newMid.minus(halfSpread);
        const newAsk = newMid.plus(halfSpread);

        priceData.bid = newBid;
        priceData.ask = newAsk;

        if (newAsk.gt(priceData.high)) priceData.high = newAsk;
        if (newBid.lt(priceData.low)) priceData.low = newBid;

        priceData.volume = priceData.volume.plus(Math.floor(Math.random() * 10 + 1));

        const changeFromOpen = newMid.minus(priceData.open);
        const changePercent = changeFromOpen.div(priceData.open).mul(100);

        const precision = symbol === 'XAGUSD' ? 3 : 2;

        const tick: TickData = {
          symbol,
          bid: newBid.toFixed(precision),
          ask: newAsk.toFixed(precision),
          high: priceData.high.toFixed(precision),
          low: priceData.low.toFixed(precision),
          open: priceData.open.toFixed(precision),
          last: newMid.toFixed(precision),
          change: changeFromOpen.toFixed(precision),
          changePercent: changePercent.toFixed(2),
          volume: priceData.volume.toFixed(0),
          timestamp: Date.now(),
        };

        redis.hset('market:prices', symbol, JSON.stringify(tick)).catch(() => {});

        if (this.tickCallback) {
          this.tickCallback(tick);
        }
      }
    }, 1000);

    console.log('[MarketEngine] Started');
  }

  /**
   * 停止行情引擎
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[MarketEngine] Stopped');
    }
  }

  /**
   * 获取当前行情快照
   * @param symbol - 品种代码（为空则返回全部）
   * @returns 行情数据
   */
  async getCurrentPrice(symbol?: string): Promise<TickData[]> {
    if (symbol) {
      const data = await redis.hget('market:prices', symbol);
      return data ? [JSON.parse(data)] : [];
    }
    const all = await redis.hgetall('market:prices');
    return Object.values(all).map((v) => JSON.parse(v));
  }

  /**
   * 生成随机价格变动（高斯近似）
   * @param volatility - 波动率参数
   * @returns 变动比例
   */
  private generatePriceChange(volatility: number): number {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    const normal = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return normal * volatility;
  }
}

export const marketEngine = new MarketEngine();
