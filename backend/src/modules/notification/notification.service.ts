import { prisma } from '../../config/database';
import { parsePagination } from '../../utils/helpers';

/**
 * 获取用户消息列表
 */
export async function list(userId: number, query: { type?: string; isRead?: string; page?: number; limit?: number }) {
  const { skip, take, page, limit } = parsePagination(query.page, query.limit);
  const where: Record<string, unknown> = { userId };
  if (query.type) where.type = query.type;
  if (query.isRead === 'true') where.isRead = true;
  if (query.isRead === 'false') where.isRead = false;

  const [list, total] = await Promise.all([
    prisma.notification.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
    prisma.notification.count({ where }),
  ]);
  return { list, total, page, limit };
}

/**
 * 标记已读
 */
export async function markRead(userId: number, id: number) {
  await prisma.notification.updateMany({ where: { id, userId }, data: { isRead: true } });
  return { message: '已标记已读' };
}

/**
 * 全部已读
 */
export async function markAllRead(userId: number) {
  await prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
  return { message: '全部已读' };
}

/**
 * 未读数
 */
export async function getUnreadCount(userId: number) {
  const count = await prisma.notification.count({ where: { userId, isRead: false } });
  return { count };
}

/**
 * 发送通知（管理端）
 */
export async function send(data: { userId: number; type: string; title: string; content: string }) {
  return prisma.notification.create({ data });
}

/**
 * 管理端通知列表
 */
export async function adminList(query: { page?: number; limit?: number }) {
  const { skip, take, page, limit } = parsePagination(query.page, query.limit);
  const [list, total] = await Promise.all([
    prisma.notification.findMany({ skip, take, orderBy: { createdAt: 'desc' } }),
    prisma.notification.count(),
  ]);
  return { list, total, page, limit };
}
