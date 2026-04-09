import { prisma } from '../../config/database';
import { marketEngine } from '../../services/marketEngine';

/**
 * Banner 列表
 */
export async function getBanners() {
  return prisma.banner.findMany({ where: { isPublished: true }, orderBy: { sortOrder: 'desc' } });
}

/**
 * 奖励卡片列表
 */
export async function getRewardCards() {
  return prisma.rewardCard.findMany({ where: { isPublished: true }, orderBy: { sortOrder: 'asc' } });
}

/**
 * 最新公告
 */
export async function getAnnouncements() {
  return prisma.announcement.findMany({ where: { isPublished: true }, take: 5, orderBy: { publishedAt: 'desc' } });
}

/**
 * 热门品种行情
 */
export async function getHotSymbols() {
  const symbols = await prisma.tradingSymbol.findMany({ where: { status: 1 }, orderBy: { sortOrder: 'asc' }, take: 3 });
  const prices = await marketEngine.getCurrentPrice();
  const priceMap = new Map(prices.map((p) => [p.symbol, p]));

  return symbols.map((s) => ({
    id: s.id, symbol: s.symbol, name: s.name,
    price: priceMap.get(s.symbol) || null,
  }));
}

// ==================== 管理端 Banner/奖励卡片 ====================

export async function adminListBanners() { return prisma.banner.findMany({ orderBy: { sortOrder: 'desc' } }); }
export async function createBanner(data: Record<string, unknown>) { return prisma.banner.create({ data: data as { title: string; image: string; linkType?: string; linkValue?: string; sortOrder?: number } }); }
export async function updateBanner(id: number, data: Record<string, unknown>) { return prisma.banner.update({ where: { id }, data }); }
export async function deleteBanner(id: number) { await prisma.banner.delete({ where: { id } }); return { message: '已删除' }; }

export async function adminListRewardCards() { return prisma.rewardCard.findMany({ orderBy: { sortOrder: 'asc' } }); }
export async function createRewardCard(data: Record<string, unknown>) { return prisma.rewardCard.create({ data: data as { title: string; description: string; icon?: string; bgColor?: string } }); }
export async function updateRewardCard(id: number, data: Record<string, unknown>) { return prisma.rewardCard.update({ where: { id }, data }); }
export async function deleteRewardCard(id: number) { await prisma.rewardCard.delete({ where: { id } }); return { message: '已删除' }; }
