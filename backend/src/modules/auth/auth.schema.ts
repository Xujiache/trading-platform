import { z } from 'zod';

/** 注册请求参数 Schema */
export const registerSchema = z.object({
  phone: z.string().regex(/^1[3-9]\d{9}$/, '手机号格式不正确'),
  password: z.string().min(8, '密码至少 8 位').max(32, '密码最多 32 位'),
  code: z.string().length(6, '验证码为 6 位数字'),
  nickname: z.string().min(2, '昵称至少 2 个字符').max(20, '昵称最多 20 个字符').optional(),
});

/** 登录请求参数 Schema */
export const loginSchema = z.object({
  account: z.string().min(1, '请输入账号'),
  password: z.string().min(1, '请输入密码'),
  twoFactorCode: z.string().length(6).optional(),
});

/** 发送验证码请求参数 Schema */
export const sendCodeSchema = z.object({
  phone: z.string().regex(/^1[3-9]\d{9}$/, '手机号格式不正确'),
  type: z.enum(['register', 'forgot_password', 'login']),
});

/** 忘记密码请求参数 Schema */
export const forgotPasswordSchema = z.object({
  phone: z.string().regex(/^1[3-9]\d{9}$/, '手机号格式不正确'),
  code: z.string().length(6, '验证码为 6 位数字'),
  newPassword: z.string().min(8, '密码至少 8 位').max(32, '密码最多 32 位'),
});

/** 刷新 Token 请求参数 Schema */
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, '请提供 refreshToken'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type SendCodeInput = z.infer<typeof sendCodeSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
