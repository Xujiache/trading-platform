import { prisma } from '../../config/database';
import { redis } from '../../config/redis';
import { hashPassword, verifyPassword, generateToken, verifyToken, generateVerifyCode } from '../../utils/crypto';
import { ConflictError, UnauthorizedError, ValidationError, NotFoundError } from '../../utils/errors';
import type { RegisterInput, LoginInput, ForgotPasswordInput } from './auth.schema';

const CODE_EXPIRE_SECONDS = 300; // 验证码有效期 5 分钟
const CODE_LIMIT_SECONDS = 60;   // 验证码发送间隔 60 秒

/**
 * 用户注册
 * @param input - 注册表单数据（手机号、密码、验证码、昵称）
 * @returns 新用户信息和 Token
 */
export async function register(input: RegisterInput) {
  const { phone, password, code, nickname } = input;

  const storedCode = await redis.get(`sms:register:${phone}`);
  if (!storedCode || storedCode !== code) {
    throw new ValidationError('验证码错误或已过期');
  }

  const exists = await prisma.user.findUnique({ where: { phone } });
  if (exists) {
    throw new ConflictError('该手机号已注册');
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      phone,
      passwordHash,
      nickname: nickname || `用户${phone.slice(-4)}`,
      userLevelId: 1,
    },
  });

  await prisma.fundAccount.create({
    data: { userId: user.id },
  });

  await redis.del(`sms:register:${phone}`);

  const accessToken = await generateToken({ id: user.id }, 'mobile');
  const refreshToken = await generateToken({ id: user.id }, 'mobile', '30d');

  return {
    user: {
      id: user.id,
      phone: user.phone,
      nickname: user.nickname,
      kycStatus: user.kycStatus,
    },
    accessToken,
    refreshToken,
  };
}

/**
 * 用户登录
 * @param input - 登录表单数据（账号、密码、可选 2FA 验证码）
 * @param ip - 客户端 IP 地址
 * @returns 用户信息和 Token
 */
export async function login(input: LoginInput, ip: string) {
  const { account, password, twoFactorCode } = input;

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { phone: account },
        { email: account },
      ],
    },
  });

  if (!user) {
    throw new UnauthorizedError('账号或密码错误');
  }

  if (user.status !== 1) {
    throw new UnauthorizedError('账号已被冻结，请联系客服');
  }

  const valid = await verifyPassword(user.passwordHash, password);
  if (!valid) {
    throw new UnauthorizedError('账号或密码错误');
  }

  if (user.twoFactorEnabled) {
    if (!twoFactorCode) {
      return { requireTwoFactor: true };
    }
    const { authenticator } = await import('otplib');
    const isValid = authenticator.check(twoFactorCode, user.twoFactorSecret!);
    if (!isValid) {
      throw new UnauthorizedError('两步验证码错误');
    }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date(), lastLoginIp: ip },
  });

  const accessToken = await generateToken({ id: user.id }, 'mobile');
  const refreshToken = await generateToken({ id: user.id }, 'mobile', '30d');

  return {
    user: {
      id: user.id,
      phone: user.phone,
      email: user.email,
      nickname: user.nickname,
      avatar: user.avatar,
      kycStatus: user.kycStatus,
      twoFactorEnabled: user.twoFactorEnabled,
    },
    accessToken,
    refreshToken,
  };
}

/**
 * 发送短信验证码
 * @param phone - 手机号
 * @param type - 验证码类型（register/forgot_password/login）
 */
export async function sendCode(phone: string, type: string) {
  const limitKey = `sms:limit:${phone}`;
  const exists = await redis.get(limitKey);
  if (exists) {
    throw new ValidationError('验证码发送过于频繁，请稍后再试');
  }

  if (type === 'register') {
    const user = await prisma.user.findUnique({ where: { phone } });
    if (user) throw new ConflictError('该手机号已注册');
  }

  if (type === 'forgot_password') {
    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) throw new NotFoundError('该手机号未注册');
  }

  const code = generateVerifyCode();

  await redis.setex(`sms:${type}:${phone}`, CODE_EXPIRE_SECONDS, code);
  await redis.setex(limitKey, CODE_LIMIT_SECONDS, '1');

  const { sendSmsCode } = await import('../../utils/sms');
  const result = await sendSmsCode(phone, code);

  if (!result.success && process.env.NODE_ENV === 'production') {
    throw new ValidationError('短信发送失败，请稍后再试');
  }

  return { message: '验证码已发送' };
}

/**
 * 忘记密码（通过验证码重置）
 * @param input - 重置表单数据（手机号、验证码、新密码）
 */
export async function forgotPassword(input: ForgotPasswordInput) {
  const { phone, code, newPassword } = input;

  const storedCode = await redis.get(`sms:forgot_password:${phone}`);
  if (!storedCode || storedCode !== code) {
    throw new ValidationError('验证码错误或已过期');
  }

  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) {
    throw new NotFoundError('该手机号未注册');
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  await redis.del(`sms:forgot_password:${phone}`);

  return { message: '密码重置成功' };
}

/**
 * 刷新访问 Token
 * @param refreshToken - 刷新 Token
 * @returns 新的 accessToken 和 refreshToken
 */
export async function refreshAccessToken(refreshToken: string) {
  try {
    const payload = await verifyToken(refreshToken, 'mobile');
    const user = await prisma.user.findUnique({ where: { id: payload.id } });

    if (!user || user.status !== 1) {
      throw new UnauthorizedError('账号状态异常');
    }

    const newAccessToken = await generateToken({ id: user.id }, 'mobile');
    const newRefreshToken = await generateToken({ id: user.id }, 'mobile', '30d');

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  } catch {
    throw new UnauthorizedError('Token 已过期，请重新登录');
  }
}
