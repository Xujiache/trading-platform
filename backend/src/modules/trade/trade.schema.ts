import { z } from 'zod';

/** 下单 Schema */
export const createOrderSchema = z.object({
  symbolId: z.number().int().positive(),
  direction: z.enum(['buy', 'sell']),
  orderType: z.enum(['market', 'limit', 'stop']),
  lots: z.number().positive(),
  leverage: z.number().int().positive(),
  stopLoss: z.number().optional(),
  takeProfit: z.number().optional(),
  trailingStop: z.number().optional(),
});

/** 改单 Schema */
export const modifyOrderSchema = z.object({
  stopLoss: z.number().optional(),
  takeProfit: z.number().optional(),
  trailingStop: z.number().optional(),
});

/** 费用预估 Schema */
export const estimateSchema = z.object({
  symbolId: z.number().int().positive(),
  lots: z.number().positive(),
  leverage: z.number().int().positive(),
  direction: z.enum(['buy', 'sell']),
});

/** 挂单 Schema */
export const pendingOrderSchema = z.object({
  symbolId: z.number().int().positive(),
  direction: z.enum(['buy', 'sell']),
  pendingType: z.enum(['buy_limit', 'sell_limit', 'buy_stop', 'sell_stop']),
  lots: z.number().positive(),
  targetPrice: z.number().positive(),
  leverage: z.number().int().positive(),
  stopLoss: z.number().optional(),
  takeProfit: z.number().optional(),
  expireAt: z.string().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type ModifyOrderInput = z.infer<typeof modifyOrderSchema>;
export type EstimateInput = z.infer<typeof estimateSchema>;
export type PendingOrderInput = z.infer<typeof pendingOrderSchema>;
