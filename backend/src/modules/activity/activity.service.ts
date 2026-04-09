import { prisma } from '../../config/database';
import { NotFoundError } from '../../utils/errors';
import { parsePagination } from '../../utils/helpers';

export async function list(query: { page?: number; limit?: number }) {
  const { skip, take, page, limit } = parsePagination(query.page, query.limit);
  const [list, total] = await Promise.all([
    prisma.activity.findMany({ skip, take, orderBy: { createdAt: 'desc' } }),
    prisma.activity.count(),
  ]);
  return { list, total, page, limit };
}

export async function create(data: Record<string, unknown>) {
  return prisma.activity.create({
    data: data as { title: string; description: string; type: string; rules: Record<string, unknown>; startAt: Date; endAt: Date },
  });
}

export async function update(id: number, data: Record<string, unknown>) {
  return prisma.activity.update({ where: { id }, data });
}

export async function remove(id: number) {
  await prisma.activity.delete({ where: { id } });
  return { message: '已删除' };
}

export async function updateStatus(id: number, status: string) {
  return prisma.activity.update({ where: { id }, data: { status } });
}

export async function getStatistics(id: number) {
  const activity = await prisma.activity.findUnique({ where: { id } });
  if (!activity) throw new NotFoundError('活动不存在');
  return { ...activity };
}
