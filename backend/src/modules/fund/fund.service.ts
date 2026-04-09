import { prisma } from '../../config/database';
import { NotFoundError, ValidationError } from '../../utils/errors';
import { generateOrderNo } from '../../utils/crypto';
import { parsePagination } from '../../utils/helpers';
import Decimal from 'decimal.js';
import type { DepositInput, WithdrawInput, DepositReviewInput, WithdrawReviewInput } from './fund.schema';

/**
 * 资产总览
 * @param userId - 用户 ID
 */
export async function getOverview(userId: number) {
  const account = await prisma.fundAccount.findUnique({ where: { userId } });
  if (!account) throw new NotFoundError('资金账户不存在');

  return {
    balance: account.balance.toString(),
    frozenBalance: account.frozenBalance.toString(),
    usedMargin: account.usedMargin.toString(),
    floatingPnl: account.floatingPnl.toString(),
    totalDeposit: account.totalDeposit.toString(),
    totalWithdraw: account.totalWithdraw.toString(),
    totalCommission: account.totalCommission.toString(),
    totalPnl: account.totalPnl.toString(),
    accountType: account.accountType,
  };
}

/**
 * 申请入金
 * @param userId - 用户 ID
 * @param input - 入金信息
 */
export async function createDeposit(userId: number, input: DepositInput) {
  return prisma.depositOrder.create({
    data: {
      orderNo: generateOrderNo('D'),
      userId,
      amount: input.amount,
      paymentMethod: input.paymentMethod,
      paymentChannel: input.paymentChannel,
      remark: input.remark,
    },
  });
}

/**
 * 入金记录
 */
export async function getDepositRecords(userId: number, query: { page?: number; limit?: number }) {
  const { skip, take, page, limit } = parsePagination(query.page, query.limit);
  const [list, total] = await Promise.all([
    prisma.depositOrder.findMany({ where: { userId }, skip, take, orderBy: { createdAt: 'desc' } }),
    prisma.depositOrder.count({ where: { userId } }),
  ]);
  return { list, total, page, limit };
}

/**
 * 申请出金
 */
export async function createWithdraw(userId: number, input: WithdrawInput) {
  const account = await prisma.fundAccount.findUnique({ where: { userId } });
  if (!account) throw new NotFoundError('资金账户不存在');

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.kycStatus !== 'approved') {
    throw new ValidationError('请先完成实名认证');
  }

  const bankCard = await prisma.bankCard.findFirst({ where: { id: input.bankCardId, userId, status: 1 } });
  if (!bankCard) throw new NotFoundError('银行卡不存在');

  const balance = new Decimal(account.balance.toString());
  const usedMargin = new Decimal(account.usedMargin.toString());
  const frozenBalance = new Decimal(account.frozenBalance.toString());
  const available = balance.minus(usedMargin).minus(frozenBalance);

  if (new Decimal(input.amount).gt(available)) {
    throw new ValidationError(`可用余额不足，可提金额 ${available.toFixed(2)}`);
  }

  const order = await prisma.$transaction(async (tx) => {
    const withdrawOrder = await tx.withdrawOrder.create({
      data: {
        orderNo: generateOrderNo('W'),
        userId,
        amount: input.amount,
        actualAmount: input.amount,
        bankCardId: input.bankCardId,
        remark: input.remark,
      },
    });

    await tx.fundAccount.update({
      where: { userId },
      data: {
        balance: { decrement: input.amount },
        frozenBalance: { increment: input.amount },
      },
    });

    return withdrawOrder;
  });

  return order;
}

/**
 * 出金记录
 */
export async function getWithdrawRecords(userId: number, query: { page?: number; limit?: number }) {
  const { skip, take, page, limit } = parsePagination(query.page, query.limit);
  const [list, total] = await Promise.all([
    prisma.withdrawOrder.findMany({ where: { userId }, skip, take, orderBy: { createdAt: 'desc' } }),
    prisma.withdrawOrder.count({ where: { userId } }),
  ]);
  return { list, total, page, limit };
}

/**
 * 资金流水
 */
export async function getFundFlows(userId: number, query: { type?: string; page?: number; limit?: number }) {
  const { skip, take, page, limit } = parsePagination(query.page, query.limit);
  const where: Record<string, unknown> = { userId };
  if (query.type) where.flowType = query.type;

  const [list, total] = await Promise.all([
    prisma.fundFlow.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
    prisma.fundFlow.count({ where }),
  ]);
  return { list, total, page, limit };
}

// ==================== 管理端资金管理 ====================

/**
 * 入金列表（管理端）
 */
export async function adminGetDeposits(query: { page?: number; limit?: number; status?: string }) {
  const { skip, take, page, limit } = parsePagination(query.page, query.limit);
  const where: Record<string, unknown> = {};
  if (query.status) where.status = query.status;

  const [list, total] = await Promise.all([
    prisma.depositOrder.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, include: { user: { select: { phone: true, nickname: true } } } }),
    prisma.depositOrder.count({ where }),
  ]);
  return { list, total, page, limit };
}

/**
 * 入金审核（管理端）
 */
export async function reviewDeposit(orderId: number, adminId: number, input: DepositReviewInput) {
  const order = await prisma.depositOrder.findUnique({ where: { id: orderId } });
  if (!order) throw new NotFoundError('订单不存在');
  if (order.status !== 'pending') throw new ValidationError('该订单已处理');

  if (input.status === 'approved') {
    await prisma.$transaction(async (tx) => {
      await tx.depositOrder.update({
        where: { id: orderId },
        data: { status: 'approved', reviewedBy: adminId, reviewedAt: new Date(), reviewRemark: input.reviewRemark },
      });

      const account = await tx.fundAccount.findUnique({ where: { userId: order.userId } });
      const balanceBefore = new Decimal(account!.balance.toString());

      await tx.fundAccount.update({
        where: { userId: order.userId },
        data: {
          balance: { increment: order.amount.toNumber() },
          totalDeposit: { increment: order.amount.toNumber() },
        },
      });

      await tx.fundFlow.create({
        data: {
          userId: order.userId,
          flowType: 'deposit',
          amount: order.amount.toNumber(),
          balanceBefore: balanceBefore.toNumber(),
          balanceAfter: balanceBefore.plus(order.amount.toString()).toNumber(),
          refType: 'deposit_order',
          refId: orderId,
          remark: `入金 ${order.amount}`,
        },
      });
    });
  } else {
    await prisma.depositOrder.update({
      where: { id: orderId },
      data: { status: 'rejected', reviewedBy: adminId, reviewedAt: new Date(), reviewRemark: input.reviewRemark },
    });
  }

  return { message: input.status === 'approved' ? '入金已通过' : '入金已驳回' };
}

/**
 * 出金列表（管理端）
 */
export async function adminGetWithdraws(query: { page?: number; limit?: number; status?: string }) {
  const { skip, take, page, limit } = parsePagination(query.page, query.limit);
  const where: Record<string, unknown> = {};
  if (query.status) where.status = query.status;

  const [list, total] = await Promise.all([
    prisma.withdrawOrder.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, include: { user: { select: { phone: true, nickname: true } }, bankCard: true } }),
    prisma.withdrawOrder.count({ where }),
  ]);
  return { list, total, page, limit };
}

/**
 * 出金审核（管理端）
 */
export async function reviewWithdraw(orderId: number, adminId: number, input: WithdrawReviewInput) {
  const order = await prisma.withdrawOrder.findUnique({ where: { id: orderId } });
  if (!order) throw new NotFoundError('订单不存在');
  if (order.status !== 'pending') throw new ValidationError('该订单已处理');

  if (input.status === 'rejected') {
    await prisma.$transaction(async (tx) => {
      await tx.withdrawOrder.update({
        where: { id: orderId },
        data: { status: 'rejected', reviewedBy: adminId, reviewedAt: new Date(), reviewRemark: input.reviewRemark },
      });

      await tx.fundAccount.update({
        where: { userId: order.userId },
        data: {
          balance: { increment: order.amount.toNumber() },
          frozenBalance: { decrement: order.amount.toNumber() },
        },
      });
    });
  } else {
    await prisma.withdrawOrder.update({
      where: { id: orderId },
      data: { status: 'approved', reviewedBy: adminId, reviewedAt: new Date(), reviewRemark: input.reviewRemark },
    });
  }

  return { message: input.status === 'approved' ? '出金审核通过' : '出金已驳回' };
}

/**
 * 打款确认（管理端）
 */
export async function processWithdraw(orderId: number, adminId: number) {
  const order = await prisma.withdrawOrder.findUnique({ where: { id: orderId } });
  if (!order) throw new NotFoundError('订单不存在');
  if (order.status !== 'approved') throw new ValidationError('该订单未通过审核');

  await prisma.$transaction(async (tx) => {
    await tx.withdrawOrder.update({
      where: { id: orderId },
      data: { status: 'completed', processedBy: adminId, processedAt: new Date() },
    });

    const account = await tx.fundAccount.findUnique({ where: { userId: order.userId } });
    const balanceBefore = new Decimal(account!.balance.toString());

    await tx.fundAccount.update({
      where: { userId: order.userId },
      data: {
        frozenBalance: { decrement: order.amount.toNumber() },
        totalWithdraw: { increment: order.amount.toNumber() },
      },
    });

    await tx.fundFlow.create({
      data: {
        userId: order.userId,
        flowType: 'withdraw',
        amount: new Decimal(order.amount.toString()).negated().toNumber(),
        balanceBefore: balanceBefore.toNumber(),
        balanceAfter: balanceBefore.toNumber(),
        refType: 'withdraw_order',
        refId: orderId,
        remark: `出金 ${order.amount}`,
      },
    });
  });

  return { message: '打款确认完成' };
}

/**
 * 财务统计（管理端）
 */
export async function getFinancialStats() {
  const [totalDeposit, totalWithdraw, pendingDeposits, pendingWithdraws] = await Promise.all([
    prisma.depositOrder.aggregate({ where: { status: 'approved' }, _sum: { amount: true } }),
    prisma.withdrawOrder.aggregate({ where: { status: 'completed' }, _sum: { amount: true } }),
    prisma.depositOrder.count({ where: { status: 'pending' } }),
    prisma.withdrawOrder.count({ where: { status: 'pending' } }),
  ]);

  return {
    totalDeposit: totalDeposit._sum.amount?.toString() || '0',
    totalWithdraw: totalWithdraw._sum.amount?.toString() || '0',
    pendingDeposits,
    pendingWithdraws,
  };
}
