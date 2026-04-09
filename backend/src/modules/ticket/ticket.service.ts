import { prisma } from '../../config/database';
import { NotFoundError, ValidationError } from '../../utils/errors';
import { generateOrderNo } from '../../utils/crypto';
import { parsePagination } from '../../utils/helpers';

// ==================== 用户端工单 ====================

export async function userListTickets(userId: number) {
  return prisma.ticket.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
}

export async function createTicket(userId: number, data: { type: string; title: string; content: string; images?: string[] }) {
  return prisma.ticket.create({
    data: {
      ticketNo: generateOrderNo('TK'),
      userId,
      type: data.type,
      title: data.title,
      content: data.content,
      images: data.images || [],
    },
  });
}

export async function getTicketDetail(userId: number, id: number) {
  const ticket = await prisma.ticket.findFirst({ where: { id, userId } });
  if (!ticket) throw new NotFoundError('工单不存在');
  return ticket;
}

export async function replyTicket(userId: number, id: number, content: string) {
  const ticket = await prisma.ticket.findFirst({ where: { id, userId } });
  if (!ticket) throw new NotFoundError('工单不存在');

  const replies = (ticket.replies as Array<Record<string, unknown>>) || [];
  replies.push({ sender: 'user', content, time: new Date().toISOString() });

  return prisma.ticket.update({ where: { id }, data: { replies } });
}

// ==================== 管理端工单 ====================

export async function adminListTickets(query: { page?: number; limit?: number; status?: string }) {
  const { skip, take, page, limit } = parsePagination(query.page, query.limit);
  const where: Record<string, unknown> = {};
  if (query.status) where.status = query.status;

  const [list, total] = await Promise.all([
    prisma.ticket.findMany({
      where, skip, take,
      include: { user: { select: { phone: true, nickname: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.ticket.count({ where }),
  ]);
  return { list, total, page, limit };
}

export async function adminReplyTicket(id: number, adminId: number, content: string) {
  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) throw new NotFoundError('工单不存在');

  const replies = (ticket.replies as Array<Record<string, unknown>>) || [];
  replies.push({ sender: 'admin', adminId, content, time: new Date().toISOString() });

  return prisma.ticket.update({
    where: { id },
    data: { replies, status: 'processing' },
  });
}

export async function closeTicket(id: number) {
  return prisma.ticket.update({ where: { id }, data: { status: 'closed' } });
}

export async function assignTicket(id: number, assignedTo: number) {
  return prisma.ticket.update({ where: { id }, data: { assignedTo, status: 'processing' } });
}

// ==================== 帮助文档 ====================

export async function listHelpArticles(query?: { category?: string }) {
  const where: Record<string, unknown> = { isPublished: true };
  if (query?.category) where.category = query.category;
  return prisma.helpArticle.findMany({ where, orderBy: { sortOrder: 'asc' } });
}

export async function adminListHelp() {
  return prisma.helpArticle.findMany({ orderBy: { sortOrder: 'asc' } });
}

export async function createHelp(data: { category: string; title: string; content: string; sortOrder?: number }) {
  return prisma.helpArticle.create({ data });
}

export async function updateHelp(id: number, data: Record<string, unknown>) {
  return prisma.helpArticle.update({ where: { id }, data });
}

export async function deleteHelp(id: number) {
  await prisma.helpArticle.delete({ where: { id } });
  return { message: '已删除' };
}

// ==================== 公告 ====================

export async function listAnnouncements(query?: { page?: number; limit?: number }) {
  const { skip, take, page, limit } = parsePagination(query?.page, query?.limit);
  const [list, total] = await Promise.all([
    prisma.announcement.findMany({ where: { isPublished: true }, skip, take, orderBy: { sortOrder: 'desc' } }),
    prisma.announcement.count({ where: { isPublished: true } }),
  ]);
  return { list, total, page, limit };
}

export async function adminListAnnouncements() {
  return prisma.announcement.findMany({ orderBy: { createdAt: 'desc' } });
}

export async function createAnnouncement(data: { title: string; content: string; type?: string }) {
  return prisma.announcement.create({ data: { ...data, isPublished: true, publishedAt: new Date() } });
}

export async function updateAnnouncement(id: number, data: Record<string, unknown>) {
  return prisma.announcement.update({ where: { id }, data });
}

export async function deleteAnnouncement(id: number) {
  await prisma.announcement.delete({ where: { id } });
  return { message: '已删除' };
}
