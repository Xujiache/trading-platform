import { prisma } from '../../config/database';

/**
 * 获取系统配置（按分类）
 */
export async function list(category?: string) {
  const where: Record<string, unknown> = {};
  if (category) where.category = category;
  return prisma.systemConfig.findMany({ where, orderBy: { category: 'asc' } });
}

/**
 * 批量更新配置
 */
export async function batchUpdate(configs: Array<{ configKey: string; configValue: string }>) {
  for (const cfg of configs) {
    await prisma.systemConfig.upsert({
      where: { configKey: cfg.configKey },
      update: { configValue: cfg.configValue },
      create: { configKey: cfg.configKey, configValue: cfg.configValue },
    });
  }
  return { message: '配置已更新' };
}

/**
 * 获取 SMTP 配置
 */
export async function getSmtpConfig() {
  return prisma.systemConfig.findMany({ where: { category: 'smtp' } });
}

/**
 * 更新 SMTP 配置
 */
export async function updateSmtpConfig(configs: Array<{ configKey: string; configValue: string }>) {
  for (const cfg of configs) {
    await prisma.systemConfig.upsert({
      where: { configKey: cfg.configKey },
      update: { configValue: cfg.configValue, category: 'smtp' },
      create: { configKey: cfg.configKey, configValue: cfg.configValue, category: 'smtp' },
    });
  }
  return { message: 'SMTP 配置已更新' };
}
