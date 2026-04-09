import { prisma } from '../../config/database';
import { ConflictError, NotFoundError, ValidationError } from '../../utils/errors';
import type { CreateRoleInput, UpdateRoleInput } from './role.schema';

/**
 * 获取角色列表
 * @returns 全部角色
 */
export async function list() {
  return prisma.role.findMany({
    orderBy: { id: 'asc' },
  });
}

/**
 * 创建角色
 * @param input - 角色数据
 * @returns 新创建的角色
 */
export async function create(input: CreateRoleInput) {
  const exists = await prisma.role.findUnique({ where: { name: input.name } });
  if (exists) throw new ConflictError('角色名已存在');

  return prisma.role.create({ data: input });
}

/**
 * 更新角色
 * @param id - 角色 ID
 * @param input - 更新数据
 * @returns 更新后的角色
 */
export async function update(id: number, input: UpdateRoleInput) {
  const role = await prisma.role.findUnique({ where: { id } });
  if (!role) throw new NotFoundError('角色不存在');

  if (role.name === 'superadmin') {
    throw new ValidationError('超级管理员角色不可修改');
  }

  if (input.name && input.name !== role.name) {
    const exists = await prisma.role.findUnique({ where: { name: input.name } });
    if (exists) throw new ConflictError('角色名已存在');
  }

  return prisma.role.update({ where: { id }, data: input });
}

/**
 * 删除角色
 * @param id - 角色 ID
 */
export async function remove(id: number) {
  const role = await prisma.role.findUnique({ where: { id } });
  if (!role) throw new NotFoundError('角色不存在');

  if (role.name === 'superadmin') {
    throw new ValidationError('超级管理员角色不可删除');
  }

  const adminCount = await prisma.admin.count({ where: { roleId: id } });
  if (adminCount > 0) {
    throw new ValidationError(`该角色下还有 ${adminCount} 个管理员，无法删除`);
  }

  await prisma.role.delete({ where: { id } });
  return { message: '角色已删除' };
}
