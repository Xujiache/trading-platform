import { z } from 'zod';

/** 风险测评提交 Schema */
export const riskAssessmentSchema = z.object({
  answers: z.array(z.object({
    questionId: z.number(),
    answer: z.string(),
    score: z.number(),
  })),
});

/** 风控参数更新 Schema */
export const riskConfigUpdateSchema = z.object({
  configKey: z.string(),
  configValue: z.string(),
  description: z.string().optional(),
});

/** 预警处理 Schema */
export const processAlertSchema = z.object({
  processRemark: z.string().optional(),
  status: z.enum(['processed', 'ignored']),
});

export type RiskAssessmentInput = z.infer<typeof riskAssessmentSchema>;
export type ProcessAlertInput = z.infer<typeof processAlertSchema>;
