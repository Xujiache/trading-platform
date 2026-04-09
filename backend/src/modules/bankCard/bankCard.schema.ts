import { z } from 'zod';

/** 添加银行卡 Schema */
export const addBankCardSchema = z.object({
  cardNumber: z.string().min(16, '卡号至少16位').max(19),
  bankName: z.string().min(2),
  branchName: z.string().optional(),
  holderName: z.string().min(2),
  holderPhone: z.string().optional(),
  isDefault: z.boolean().optional(),
});

export type AddBankCardInput = z.infer<typeof addBankCardSchema>;
