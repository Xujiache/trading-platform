import { prisma } from '../../config/database';
import { NotFoundError } from '../../utils/errors';

/**
 * 第三方接口管理业务逻辑
 * 管理外部服务配置（行情数据源、支付通道等）
 */
export class IntegrationService {
  /**
   * 获取第三方接口配置列表
   * @returns 配置列表
   */
  static async getList() {
    return prisma.systemConfig.findMany({
      where: { category: 'integration' },
      orderBy: { configKey: 'asc' },
    });
  }

  /**
   * 更新第三方接口配置
   * @param id - 配置 ID
   * @param data - 更新数据
   * @returns 更新后的配置
   */
  static async update(id: number, data: { configValue: string; description?: string }) {
    const config = await prisma.systemConfig.findUnique({ where: { id } });
    if (!config) throw new NotFoundError('配置不存在');

    return prisma.systemConfig.update({
      where: { id },
      data: {
        configValue: data.configValue,
        description: data.description ?? config.description,
      },
    });
  }

  /**
   * 测试第三方接口连通性
   * @param id - 配置 ID
   * @returns 测试结果
   */
  static async testConnection(id: number) {
    const config = await prisma.systemConfig.findUnique({ where: { id } });
    if (!config) throw new NotFoundError('配置不存在');

    try {
      const url = config.configValue;
      if (!url.startsWith('http')) {
        return { success: true, message: '配置项非 URL 类型，跳过连通性测试' };
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeout);

      return {
        success: response.ok,
        message: response.ok ? '连接成功' : `HTTP ${response.status}`,
        statusCode: response.status,
      };
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : '连接失败',
      };
    }
  }
}
