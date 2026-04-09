import { prisma } from '../../config/database';
import { NotFoundError, ValidationError } from '../../utils/errors';
import type { CreateAlertInput, UpdateAlertInput } from './alert.schema';

const MAX_ALERTS_PER_USER = 20;

/**
 * 获取用户预警列表
 * @param userId - 用户 ID
 */
export async function list(userId: number) {
  return prisma.priceAlert.findMany({
    where: { userId },
    include: { symbol: { select: { symbol: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * 创建预警
 * @param userId - 用户 ID
 * @param input - 预警数据
 */
export async function create(userId: number, input: CreateAlertInput) {
  const count = await prisma.priceAlert.count({
    where: { userId, status: 'active' },
  });
  if (count >= MAX_ALERTS_PER_USER) {
    throw new ValidationError(`最多设置 ${MAX_ALERTS_PER_USER} 个预警`);
  }

  const symbol = await prisma.tradingSymbol.findUnique({ where: { id: input.symbolId } });
  if (!symbol) throw new NotFoundError('品种不存在');

  return prisma.priceAlert.create({
    data: {
      userId,
      symbolId: input.symbolId,
      alertType: input.alertType,
      targetValue: input.targetValue,
    },
    include: { symbol: { select: { symbol: true, name: true } } },
  });
}

/**
 * 更新预警
 * @param userId - 用户 ID
 * @param id - 预警 ID
 * @param input - 更新数据
 */
export async function update(userId: number, id: number, input: UpdateAlertInput) {
  const alert = await prisma.priceAlert.findFirst({ where: { id, userId } });
  if (!alert) throw new NotFoundError('预警不存在');

  return prisma.priceAlert.update({ where: { id }, data: input });
}

/**
 * 删除预警
 * @param userId - 用户 ID
 * @param id - 预警 ID
 */
export async function remove(userId: number, id: number) {
  const alert = await prisma.priceAlert.findFirst({ where: { id, userId } });
  if (!alert) throw new NotFoundError('预警不存在');

  await prisma.priceAlert.delete({ where: { id } });
  return { message: '预警已删除' };
}
