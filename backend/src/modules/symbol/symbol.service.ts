import { prisma } from '../../config/database';
import { NotFoundError } from '../../utils/errors';
import type { UpdateSymbolInput, FeeTierInput } from './symbol.schema';

/**
 * 获取品种列表（管理端，包含全部字段）
 */
export async function list() {
  return prisma.tradingSymbol.findMany({ orderBy: { sortOrder: 'asc' } });
}

/**
 * 更新品种
 * @param id - 品种 ID
 * @param input - 更新数据
 */
export async function update(id: number, input: UpdateSymbolInput) {
  const symbol = await prisma.tradingSymbol.findUnique({ where: { id } });
  if (!symbol) throw new NotFoundError('品种不存在');
  return prisma.tradingSymbol.update({ where: { id }, data: input });
}

/**
 * 启用/禁用品种
 * @param id - 品种 ID
 * @param status - 状态值
 */
export async function updateStatus(id: number, status: number) {
  const symbol = await prisma.tradingSymbol.findUnique({ where: { id } });
  if (!symbol) throw new NotFoundError('品种不存在');
  return prisma.tradingSymbol.update({ where: { id }, data: { status } });
}

/**
 * 获取品种阶梯费率列表
 * @param symbolId - 品种 ID
 */
export async function getFeeTiers(symbolId: number) {
  return prisma.symbolFeeTier.findMany({ where: { symbolId }, orderBy: { tierMin: 'asc' } });
}

/**
 * 新增阶梯费率
 * @param input - 阶梯费率数据
 */
export async function createFeeTier(input: FeeTierInput) {
  return prisma.symbolFeeTier.create({ data: input });
}

/**
 * 删除阶梯费率
 * @param id - 费率 ID
 */
export async function deleteFeeTier(id: number) {
  const tier = await prisma.symbolFeeTier.findUnique({ where: { id } });
  if (!tier) throw new NotFoundError('费率记录不存在');
  await prisma.symbolFeeTier.delete({ where: { id } });
  return { message: '已删除' };
}

/**
 * 获取模拟盘费用配置列表
 */
export async function getDemoFeeList() {
  return prisma.demoFeeConfig.findMany({
    include: { symbol: { select: { symbol: true, name: true } } },
  });
}

/**
 * 更新模拟盘费用配置
 * @param symbolId - 品种 ID
 * @param data - 费用配置
 */
export async function updateDemoFee(symbolId: number, data: Record<string, unknown>) {
  const existing = await prisma.demoFeeConfig.findFirst({ where: { symbolId } });
  if (existing) {
    return prisma.demoFeeConfig.update({ where: { id: existing.id }, data });
  }
  return prisma.demoFeeConfig.create({ data: { symbolId, ...data } });
}
