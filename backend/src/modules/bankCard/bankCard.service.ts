import { prisma } from '../../config/database';
import { NotFoundError, ValidationError } from '../../utils/errors';
import { maskCardNumber } from '../../utils/helpers';
import type { AddBankCardInput } from './bankCard.schema';

/**
 * 银行卡列表
 * @param userId - 用户 ID
 */
export async function list(userId: number) {
  const cards = await prisma.bankCard.findMany({
    where: { userId, status: 1 },
    orderBy: { createdAt: 'desc' },
  });
  return cards.map((c) => ({
    ...c,
    cardNumber: maskCardNumber(c.cardNumber),
  }));
}

/**
 * 添加银行卡
 * @param userId - 用户 ID
 * @param input - 银行卡数据
 */
export async function add(userId: number, input: AddBankCardInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.kycStatus !== 'approved') {
    throw new ValidationError('请先完成实名认证');
  }

  if (input.holderName !== user.realName) {
    throw new ValidationError('持卡人姓名须与实名认证一致');
  }

  const count = await prisma.bankCard.count({ where: { userId, status: 1 } });
  if (count >= 5) throw new ValidationError('最多绑定 5 张银行卡');

  if (input.isDefault) {
    await prisma.bankCard.updateMany({ where: { userId }, data: { isDefault: false } });
  }

  return prisma.bankCard.create({
    data: { userId, ...input, isDefault: input.isDefault || count === 0 },
  });
}

/**
 * 删除银行卡（软删除）
 * @param userId - 用户 ID
 * @param id - 银行卡 ID
 */
export async function remove(userId: number, id: number) {
  const card = await prisma.bankCard.findFirst({ where: { id, userId, status: 1 } });
  if (!card) throw new NotFoundError('银行卡不存在');

  await prisma.bankCard.update({ where: { id }, data: { status: 0 } });
  return { message: '银行卡已删除' };
}
