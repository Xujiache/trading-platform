import { prisma } from '../../config/database';
import { hashPassword, verifyPassword, generateToken } from '../../utils/crypto';
import { ConflictError, NotFoundError, UnauthorizedError, ValidationError } from '../../utils/errors';
import { parsePagination, maskPhone, maskIdCard } from '../../utils/helpers';
import type { AdminLoginInput, CreateAdminInput, UpdateAdminInput, AdminChangePasswordInput, KycReviewInput } from './admin.schema';

/**
 * 管理员登录
 * @param input - 登录凭据
 * @param ip - 客户端 IP
 * @returns 管理员信息和 Token
 */
export async function login(input: AdminLoginInput, ip: string) {
  const admin = await prisma.admin.findUnique({
    where: { username: input.username },
    include: { role: true },
  });

  if (!admin) throw new UnauthorizedError('用户名或密码错误');
  if (admin.status !== 1) throw new UnauthorizedError('账号已禁用');

  const valid = await verifyPassword(admin.passwordHash, input.password);
  if (!valid) throw new UnauthorizedError('用户名或密码错误');

  await prisma.admin.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date(), lastLoginIp: ip },
  });

  const accessToken = await generateToken({ id: admin.id }, 'admin');

  return {
    admin: {
      id: admin.id,
      username: admin.username,
      realName: admin.realName,
      role: { name: admin.role.name, displayName: admin.role.displayName },
      permissions: admin.role.permissions,
    },
    accessToken,
  };
}

/**
 * 获取管理员信息
 * @param adminId - 管理员 ID
 */
export async function getProfile(adminId: number) {
  const admin = await prisma.admin.findUnique({
    where: { id: adminId },
    include: { role: true },
  });
  if (!admin) throw new NotFoundError('管理员不存在');

  return {
    id: admin.id,
    username: admin.username,
    realName: admin.realName,
    email: admin.email,
    phone: admin.phone,
    role: { name: admin.role.name, displayName: admin.role.displayName },
    permissions: admin.role.permissions,
  };
}

/**
 * 管理员修改密码
 * @param adminId - 管理员 ID
 * @param input - 旧密码和新密码
 */
export async function changePassword(adminId: number, input: AdminChangePasswordInput) {
  const admin = await prisma.admin.findUnique({ where: { id: adminId } });
  if (!admin) throw new NotFoundError('管理员不存在');

  const valid = await verifyPassword(admin.passwordHash, input.oldPassword);
  if (!valid) throw new UnauthorizedError('旧密码错误');

  const passwordHash = await hashPassword(input.newPassword);
  await prisma.admin.update({ where: { id: adminId }, data: { passwordHash } });

  return { message: '密码修改成功' };
}

/**
 * 管理员列表
 */
export async function listAdmins() {
  return prisma.admin.findMany({
    include: { role: { select: { name: true, displayName: true } } },
    orderBy: { id: 'asc' },
  });
}

/**
 * 创建管理员
 * @param input - 管理员数据
 */
export async function createAdmin(input: CreateAdminInput) {
  const exists = await prisma.admin.findUnique({ where: { username: input.username } });
  if (exists) throw new ConflictError('用户名已存在');

  const role = await prisma.role.findUnique({ where: { id: input.roleId } });
  if (!role) throw new NotFoundError('角色不存在');

  const passwordHash = await hashPassword(input.password);
  return prisma.admin.create({
    data: {
      username: input.username,
      passwordHash,
      realName: input.realName,
      email: input.email,
      phone: input.phone,
      roleId: input.roleId,
    },
  });
}

/**
 * 更新管理员
 * @param id - 管理员 ID
 * @param input - 更新数据
 */
export async function updateAdmin(id: number, input: UpdateAdminInput) {
  const admin = await prisma.admin.findUnique({ where: { id } });
  if (!admin) throw new NotFoundError('管理员不存在');

  if (input.roleId) {
    const role = await prisma.role.findUnique({ where: { id: input.roleId } });
    if (!role) throw new NotFoundError('角色不存在');
  }

  return prisma.admin.update({ where: { id }, data: input });
}

/**
 * 启用/禁用管理员
 * @param id - 管理员 ID
 * @param status - 状态（1=启用, 0=禁用）
 */
export async function updateAdminStatus(id: number, status: number) {
  const admin = await prisma.admin.findUnique({ where: { id } });
  if (!admin) throw new NotFoundError('管理员不存在');

  return prisma.admin.update({ where: { id }, data: { status } });
}

// ==================== 管理端用户管理 ====================

/**
 * 用户列表（管理端，支持多条件筛选+分页）
 * @param query - 查询参数
 */
export async function listUsers(query: { page?: number; limit?: number; keyword?: string; status?: number; kycStatus?: string }) {
  const { skip, take, page, limit } = parsePagination(query.page, query.limit);

  const where: Record<string, unknown> = {};
  if (query.status !== undefined) where.status = query.status;
  if (query.kycStatus) where.kycStatus = query.kycStatus;
  if (query.keyword) {
    where.OR = [
      { phone: { contains: query.keyword } },
      { email: { contains: query.keyword } },
      { nickname: { contains: query.keyword } },
      { realName: { contains: query.keyword } },
    ];
  }

  const [list, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take,
      include: { userLevel: { select: { name: true, displayName: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  const maskedList = list.map((u) => ({
    ...u,
    phone: u.phone ? maskPhone(u.phone) : null,
    idCard: u.idCard ? maskIdCard(u.idCard) : null,
    passwordHash: undefined,
    twoFactorSecret: undefined,
  }));

  return { list: maskedList, total, page, limit };
}

/**
 * 用户详情（管理端）
 * @param userId - 用户 ID
 */
export async function getUserDetail(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userLevel: true,
      fundAccount: true,
    },
  });

  if (!user) throw new NotFoundError('用户不存在');

  return {
    ...user,
    passwordHash: undefined,
    twoFactorSecret: undefined,
  };
}

/**
 * 冻结/解冻用户
 * @param userId - 用户 ID
 * @param status - 状态（1=正常, 2=冻结, 0=禁用）
 */
export async function updateUserStatus(userId: number, status: number) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('用户不存在');

  return prisma.user.update({ where: { id: userId }, data: { status } });
}

/**
 * 重置用户密码
 * @param userId - 用户 ID
 * @param newPassword - 新密码
 */
export async function resetUserPassword(userId: number, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('用户不存在');

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

  return { message: '密码已重置' };
}

/**
 * 待审核 KYC 列表
 */
export async function getPendingKyc(query: { page?: number; limit?: number }) {
  const { skip, take, page, limit } = parsePagination(query.page, query.limit);

  const [list, total] = await Promise.all([
    prisma.user.findMany({
      where: { kycStatus: 'pending' },
      skip,
      take,
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.user.count({ where: { kycStatus: 'pending' } }),
  ]);

  return { list, total, page, limit };
}

/**
 * KYC 审核
 * @param userId - 用户 ID
 * @param input - 审核结果
 */
export async function reviewKyc(userId: number, input: KycReviewInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('用户不存在');

  if (user.kycStatus !== 'pending') {
    throw new ValidationError('该用户没有待审核的 KYC 申请');
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      kycStatus: input.status,
      kycReason: input.status === 'rejected' ? input.reason : null,
    },
  });

  return { message: input.status === 'approved' ? 'KYC 审核通过' : 'KYC 已驳回' };
}
