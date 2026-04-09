import { z } from 'zod';

/** 启用 2FA Schema */
export const enableTwoFactorSchema = z.object({
  code: z.string().length(6, '验证码为 6 位数字'),
});

/** 关闭 2FA Schema */
export const disableTwoFactorSchema = z.object({
  code: z.string().length(6, '验证码为 6 位数字'),
  password: z.string().min(1, '请输入密码'),
});

/** 验证 2FA Schema */
export const verifyTwoFactorSchema = z.object({
  code: z.string().length(6, '验证码为 6 位数字'),
});

export type EnableTwoFactorInput = z.infer<typeof enableTwoFactorSchema>;
export type DisableTwoFactorInput = z.infer<typeof disableTwoFactorSchema>;
export type VerifyTwoFactorInput = z.infer<typeof verifyTwoFactorSchema>;
