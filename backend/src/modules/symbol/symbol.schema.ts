import { z } from 'zod';

/** 更新品种 Schema */
export const updateSymbolSchema = z.object({
  name: z.string().optional(),
  spreadType: z.enum(['fixed', 'floating']).optional(),
  spreadValue: z.number().optional(),
  spreadMin: z.number().optional(),
  spreadMax: z.number().optional(),
  commissionType: z.enum(['per_lot', 'percentage']).optional(),
  commissionValue: z.number().optional(),
  commissionSide: z.enum(['single', 'double']).optional(),
  swapLong: z.number().optional(),
  swapShort: z.number().optional(),
  minLots: z.number().optional(),
  maxLots: z.number().optional(),
  maxPositionLots: z.number().optional(),
  leverageMin: z.number().int().optional(),
  leverageMax: z.number().int().optional(),
  maxSlippage: z.number().optional(),
  status: z.number().int().min(0).max(1).optional(),
  sortOrder: z.number().int().optional(),
});

/** 阶梯费率 Schema */
export const feeTierSchema = z.object({
  symbolId: z.number().int().positive(),
  tierType: z.enum(['volume', 'level']),
  tierMin: z.number(),
  tierMax: z.number(),
  feeValue: z.number(),
});

export type UpdateSymbolInput = z.infer<typeof updateSymbolSchema>;
export type FeeTierInput = z.infer<typeof feeTierSchema>;
