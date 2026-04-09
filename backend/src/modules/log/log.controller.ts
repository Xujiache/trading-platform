import { FastifyRequest, FastifyReply } from 'fastify';
import { LogService } from './log.service';
import { paginate, success } from '../../utils/response';

/**
 * 操作日志控制器
 * 处理管理端日志查询请求
 */
export class LogController {
  /**
   * 获取日志列表（支持多条件筛选+分页）
   */
  static async getList(request: FastifyRequest, reply: FastifyReply) {
    const query = request.query as {
      adminId?: string;
      module?: string;
      action?: string;
      startDate?: string;
      endDate?: string;
      page?: string;
      limit?: string;
    };

    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '20');

    const { list, total } = await LogService.getList({
      adminId: query.adminId ? parseInt(query.adminId) : undefined,
      module: query.module,
      action: query.action,
      startDate: query.startDate,
      endDate: query.endDate,
      page,
      limit,
    });

    return paginate(reply, list, total, page, limit);
  }

  /**
   * 获取操作模块列表
   */
  static async getModules(request: FastifyRequest, reply: FastifyReply) {
    const modules = await LogService.getModules();
    return success(reply, modules);
  }
}
