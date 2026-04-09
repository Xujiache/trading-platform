import { prisma } from '../../config/database';

/**
 * 操作日志业务逻辑
 * 查询管理端操作日志
 */
export class LogService {
  /**
   * 获取操作日志列表（分页+筛选）
   * @param params - 筛选参数
   * @returns 日志列表和总数
   */
  static async getList(params: {
    adminId?: number;
    module?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
    page: number;
    limit: number;
  }) {
    const { adminId, module, action, startDate, endDate, page, limit } = params;

    const where: Record<string, unknown> = {};
    if (adminId) where.adminId = adminId;
    if (module) where.module = module;
    if (action) where.action = { contains: action };
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) (where.createdAt as Record<string, unknown>).gte = new Date(startDate);
      if (endDate) (where.createdAt as Record<string, unknown>).lte = new Date(endDate);
    }

    const [list, total] = await Promise.all([
      prisma.operationLog.findMany({
        where,
        include: { admin: { select: { id: true, username: true, realName: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.operationLog.count({ where }),
    ]);

    return { list, total };
  }

  /**
   * 获取所有操作模块类型（用于筛选下拉框）
   * @returns 模块名称列表
   */
  static async getModules() {
    const modules = await prisma.operationLog.findMany({
      select: { module: true },
      distinct: ['module'],
      orderBy: { module: 'asc' },
    });
    return modules.map((m) => m.module);
  }
}
