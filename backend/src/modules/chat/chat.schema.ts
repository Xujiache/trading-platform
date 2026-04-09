import { z } from 'zod';

/**
 * 创建/获取客服会话请求参数
 */
export const createSessionSchema = z.object({});

/**
 * 获取历史消息请求参数
 */
export const getMessagesSchema = z.object({
  sessionId: z.coerce.number().int().positive(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/**
 * 管理端接单/分配请求参数
 */
export const assignSessionSchema = z.object({
  adminId: z.number().int().positive().optional(),
});

/**
 * 管理端消息列表请求参数
 */
export const sessionMessagesSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
