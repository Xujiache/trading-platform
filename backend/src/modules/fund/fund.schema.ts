import { z } from 'zod';

/** 申请入金 Schema */
export const depositSchema = z.object({
  amount: z.number().positive('入金金额必须大于 0'),
  paymentMethod: z.string().min(1),
  paymentChannel: z.string().optional(),
  remark: z.string().optional(),
});

/** 申请出金 Schema */
export const withdrawSchema = z.object({
  amount: z.number().positive('出金金额必须大于 0'),
  bankCardId: z.number().int().positive(),
  remark: z.string().optional(),
});

/** 入金审核 Schema */
export const depositReviewSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  reviewRemark: z.string().optional(),
});

/** 出金审核 Schema */
export const withdrawReviewSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  reviewRemark: z.string().optional(),
});

/** 打款确认 Schema */
export const withdrawProcessSchema = z.object({
  status: z.enum(['completed']),
});

export type DepositInput = z.infer<typeof depositSchema>;
export type WithdrawInput = z.infer<typeof withdrawSchema>;
export type DepositReviewInput = z.infer<typeof depositReviewSchema>;
export type WithdrawReviewInput = z.infer<typeof withdrawReviewSchema>;
