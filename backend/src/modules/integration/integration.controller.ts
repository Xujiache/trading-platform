import { FastifyRequest, FastifyReply } from 'fastify';
import { IntegrationService } from './integration.service';
import { success } from '../../utils/response';

/**
 * 第三方接口管理控制器
 */
export class IntegrationController {
  /**
   * 获取接口配置列表
   */
  static async getList(request: FastifyRequest, reply: FastifyReply) {
    const list = await IntegrationService.getList();
    return success(reply, list);
  }

  /**
   * 更新接口配置
   */
  static async update(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const body = request.body as { configValue: string; description?: string };
    const result = await IntegrationService.update(parseInt(id), body);
    return success(reply, result);
  }

  /**
   * 测试接口连通性
   */
  static async testConnection(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const result = await IntegrationService.testConnection(parseInt(id));
    return success(reply, result);
  }
}
