import { prisma } from '../../config/database';
import { hashPassword, verifyPassword } from '../../utils/crypto';
import { NotFoundError, UnauthorizedError, ValidationError, ConflictError } from '../../utils/errors';
import { maskIdCard, maskPhone } from '../../utils/helpers';
import * as fs from 'fs';
import * as path from 'path';
import { config } from '../../config';
import type { UpdateProfileInput, ChangePasswordInput, KycSubmitInput } from './user.schema';

/**
 * 获取用户个人信息
 * @param userId - 用户 ID
 * @returns 用户信息（敏感字段已脱敏）
 */
export async function getProfile(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { userLevel: true },
  });

  if (!user) throw new NotFoundError('用户不存在');

  return {
    id: user.id,
    phone: user.phone ? maskPhone(user.phone) : null,
    email: user.email,
    nickname: user.nickname,
    avatar: user.avatar,
    realName: user.realName,
    idCard: user.idCard ? maskIdCard(user.idCard) : null,
    kycStatus: user.kycStatus,
    twoFactorEnabled: user.twoFactorEnabled,
    riskLevel: user.riskLevel,
    userLevel: {
      name: user.userLevel.name,
      displayName: user.userLevel.displayName,
    },
    createdAt: user.createdAt,
  };
}

/**
 * 修改个人资料
 * @param userId - 用户 ID
 * @param input - 修改内容
 * @returns 更新后的用户信息
 */
export async function updateProfile(userId: number, input: UpdateProfileInput) {
  if (input.email) {
    const existing = await prisma.user.findFirst({
      where: { email: input.email, NOT: { id: userId } },
    });
    if (existing) throw new ConflictError('该邮箱已被使用');
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: input,
  });

  return { id: user.id, nickname: user.nickname, email: user.email };
}

/**
 * 修改密码
 * @param userId - 用户 ID
 * @param input - 旧密码和新密码
 */
export async function changePassword(userId: number, input: ChangePasswordInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('用户不存在');

  const valid = await verifyPassword(user.passwordHash, input.oldPassword);
  if (!valid) throw new UnauthorizedError('旧密码错误');

  const passwordHash = await hashPassword(input.newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  return { message: '密码修改成功' };
}

/**
 * 提交 KYC 实名认证
 * @param userId - 用户 ID
 * @param input - KYC 资料
 */
export async function submitKyc(userId: number, input: KycSubmitInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('用户不存在');

  if (user.kycStatus === 'approved') {
    throw new ValidationError('已通过实名认证，无需重复提交');
  }

  if (user.kycStatus === 'pending') {
    throw new ValidationError('实名认证审核中，请耐心等待');
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      realName: input.realName,
      idCard: input.idCard,
      idCardFront: input.idCardFront,
      idCardBack: input.idCardBack,
      kycStatus: 'pending',
      kycReason: null,
    },
  });

  return { message: '实名认证资料已提交，请等待审核' };
}

/**
 * 上传头像
 * @param userId - 用户 ID
 * @param fileBuffer - 文件 Buffer
 * @param filename - 文件名
 * @returns 头像 URL
 */
export async function uploadAvatar(userId: number, fileBuffer: Buffer, filename: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('用户不存在');

  const uploadDir = path.join(config.upload.path, 'avatars');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const ext = path.extname(filename) || '.jpg';
  const savedName = `avatar_${userId}_${Date.now()}${ext}`;
  const filePath = path.join(uploadDir, savedName);
  fs.writeFileSync(filePath, fileBuffer);

  const avatarUrl = `/uploads/avatars/${savedName}`;
  await prisma.user.update({
    where: { id: userId },
    data: { avatar: avatarUrl },
  });

  return { avatar: avatarUrl };
}

/**
 * 获取 KYC 认证状态
 * @param userId - 用户 ID
 * @returns KYC 状态信息
 */
export async function getKycStatus(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { kycStatus: true, kycReason: true, realName: true },
  });

  if (!user) throw new NotFoundError('用户不存在');

  return {
    kycStatus: user.kycStatus,
    kycReason: user.kycReason,
    realName: user.realName,
  };
}
