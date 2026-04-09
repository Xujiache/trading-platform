import { z } from 'zod';

/** 管理员登录 Schema */
export const adminLoginSchema = z.object({
  username: z.string().min(1, '请输入用户名'),
  password: z.string().min(1, '请输入密码'),
});

/** 创建管理员 Schema */
export const createAdminSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(8).max(32),
  realName: z.string().min(2).max(50),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  roleId: z.number().int().positive(),
});

/** 更新管理员 Schema */
export const updateAdminSchema = z.object({
  realName: z.string().min(2).max(50).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  roleId: z.number().int().positive().optional(),
});

/** 修改管理员密码 Schema */
export const adminChangePasswordSchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: z.string().min(8).max(32),
});

/** 管理员状态 Schema */
export const adminStatusSchema = z.object({
  status: z.number().int().min(0).max(1),
});

/** 管理端用户列表查询参数 */
export const adminUserListSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  keyword: z.string().optional(),
  status: z.coerce.number().int().optional(),
  kycStatus: z.string().optional(),
});

/** KYC 审核 Schema */
export const kycReviewSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  reason: z.string().optional(),
});

/** 重置用户密码 Schema */
export const resetUserPasswordSchema = z.object({
  newPassword: z.string().min(8).max(32),
});

/** 用户状态变更 Schema */
export const userStatusSchema = z.object({
  status: z.number().int().min(0).max(2),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
export type CreateAdminInput = z.infer<typeof createAdminSchema>;
export type UpdateAdminInput = z.infer<typeof updateAdminSchema>;
export type AdminChangePasswordInput = z.infer<typeof adminChangePasswordSchema>;
export type KycReviewInput = z.infer<typeof kycReviewSchema>;
