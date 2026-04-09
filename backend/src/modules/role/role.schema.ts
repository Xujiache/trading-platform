import { z } from 'zod';

/** 创建角色 Schema */
export const createRoleSchema = z.object({
  name: z.string().min(2).max(50),
  displayName: z.string().min(2).max(50),
  permissions: z.array(z.string()),
  description: z.string().optional(),
  status: z.number().int().min(0).max(1).optional(),
});

/** 更新角色 Schema */
export const updateRoleSchema = createRoleSchema.partial();

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
