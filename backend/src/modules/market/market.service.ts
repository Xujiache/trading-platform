import { prisma } from '../../config/database';
import { marketEngine } from '../../services/marketEngine';
import { NotFoundError } from '../../utils/errors';

/**
 * 获取品种列表（含实时行情）
 * @returns 品种列表及当前行情数据
 */
export async function getSymbols() {
  const symbols = await prisma.tradingSymbol.findMany({
    where: { status: 1 },
    orderBy: { sortOrder: 'asc' },
  });

  const prices = await marketEngine.getCurrentPrice();
  const priceMap = new Map(prices.map((p) => [p.symbol, p]));

  return symbols.map((s) => ({
    id: s.id,
    symbol: s.symbol,
    name: s.name,
    category: s.category,
    contractUnit: s.contractUnit,
    contractUnitDesc: s.contractUnitDesc,
    pricePrecision: s.pricePrecision,
    price: priceMap.get(s.symbol) || null,
  }));
}

/**
 * 获取品种详情
 * @param id - 品种 ID
 * @returns 品种完整信息 + 实时行情
 */
export async function getSymbolDetail(id: number) {
  const symbol = await prisma.tradingSymbol.findUnique({ where: { id } });
  if (!symbol) throw new NotFoundError('品种不存在');

  const prices = await marketEngine.getCurrentPrice(symbol.symbol);

  return {
    ...symbol,
    price: prices[0] || null,
  };
}

/**
 * 获取 K 线数据
 * @param symbolId - 品种 ID
 * @param period - K 线周期（1m/5m/15m/30m/1h/4h/1d）
 * @param limit - 返回条数
 * @returns K 线数据数组
 */
export async function getKlineData(symbolId: number, period: string, limit: number) {
  const symbol = await prisma.tradingSymbol.findUnique({ where: { id: symbolId } });
  if (!symbol) throw new NotFoundError('品种不存在');

  const klines = await prisma.klineHistory.findMany({
    where: { symbolId, period },
    orderBy: { openTime: 'desc' },
    take: Math.min(limit, 500),
  });

  return klines.reverse().map((k) => ({
    time: k.openTime.getTime(),
    open: k.open.toString(),
    high: k.high.toString(),
    low: k.low.toString(),
    close: k.close.toString(),
    volume: k.volume.toString(),
  }));
}
