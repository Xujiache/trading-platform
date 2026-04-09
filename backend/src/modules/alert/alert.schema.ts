import { z } from 'zod';

/** 创建预警 Schema */
export const createAlertSchema = z.object({
  symbolId: z.number().int().positive(),
  alertType: z.enum(['price_above', 'price_below', 'change_percent']),
  targetValue: z.number().positive(),
});

/** 更新预警 Schema */
export const updateAlertSchema = z.object({
  alertType: z.enum(['price_above', 'price_below', 'change_percent']).optional(),
  targetValue: z.number().positive().optional(),
  status: z.enum(['active', 'disabled']).optional(),
});

export type CreateAlertInput = z.infer<typeof createAlertSchema>;
export type UpdateAlertInput = z.infer<typeof updateAlertSchema>;
