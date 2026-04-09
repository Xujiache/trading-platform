import { z } from 'zod';

/** 修改个人资料 Schema */
export const updateProfileSchema = z.object({
  nickname: z.string().min(2).max(20).optional(),
  email: z.string().email('邮箱格式不正确').optional(),
});

/** 修改密码 Schema */
export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, '请输入旧密码'),
  newPassword: z.string().min(8, '新密码至少 8 位').max(32, '新密码最多 32 位'),
});

/** 提交 KYC Schema */
export const kycSubmitSchema = z.object({
  realName: z.string().min(2, '请输入真实姓名'),
  idCard: z.string().regex(/^\d{17}[\dXx]$/, '身份证号格式不正确'),
  idCardFront: z.string().min(1, '请上传身份证正面照'),
  idCardBack: z.string().min(1, '请上传身份证反面照'),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type KycSubmitInput = z.infer<typeof kycSubmitSchema>;
