import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import { prisma } from '../../config/database';
import { verifyPassword } from '../../utils/crypto';
import { NotFoundError, ValidationError, UnauthorizedError } from '../../utils/errors';
import type { EnableTwoFactorInput, DisableTwoFactorInput } from './twoFactor.schema';

/**
 * 生成 TOTP 二维码和密钥
 * @param userId - 用户 ID
 * @returns 二维码图片（Base64）和密钥
 */
export async function generateSecret(userId: number) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('用户不存在');

  if (user.twoFactorEnabled) {
    throw new ValidationError('两步验证已开启');
  }

  const secret = authenticator.generateSecret();
  const otpauth = authenticator.keyuri(
    user.phone || user.email || `user_${user.id}`,
    '寰球汇金交易所',
    secret
  );

  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorSecret: secret },
  });

  const qrCode = await QRCode.toDataURL(otpauth);

  return { secret, qrCode };
}

/**
 * 启用两步验证
 * @param userId - 用户 ID
 * @param input - 包含 6 位验证码
 */
export async function enable(userId: number, input: EnableTwoFactorInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('用户不存在');

  if (!user.twoFactorSecret) {
    throw new ValidationError('请先生成二维码');
  }

  const isValid = authenticator.check(input.code, user.twoFactorSecret);
  if (!isValid) {
    throw new ValidationError('验证码错误，请重试');
  }

  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorEnabled: true },
  });

  return { message: '两步验证已开启' };
}

/**
 * 关闭两步验证
 * @param userId - 用户 ID
 * @param input - 包含验证码和密码
 */
export async function disable(userId: number, input: DisableTwoFactorInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('用户不存在');

  if (!user.twoFactorEnabled) {
    throw new ValidationError('两步验证未开启');
  }

  const passwordValid = await verifyPassword(user.passwordHash, input.password);
  if (!passwordValid) {
    throw new UnauthorizedError('密码错误');
  }

  const isValid = authenticator.check(input.code, user.twoFactorSecret!);
  if (!isValid) {
    throw new ValidationError('验证码错误');
  }

  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorEnabled: false, twoFactorSecret: null },
  });

  return { message: '两步验证已关闭' };
}

/**
 * 验证 TOTP 验证码
 * @param userId - 用户 ID
 * @param code - 6 位验证码
 * @returns 验证结果
 */
export async function verify(userId: number, code: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.twoFactorSecret) {
    throw new ValidationError('两步验证未配置');
  }

  const isValid = authenticator.check(code, user.twoFactorSecret);
  return { valid: isValid };
}
