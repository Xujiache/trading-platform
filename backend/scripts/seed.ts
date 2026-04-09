import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

/**
 * 数据库种子数据初始化
 * 包含默认角色(6个)、用户等级(5个)、交易品种(3个)、默认管理员、系统配置、风控配置
 */
async function seed() {
  console.log('🌱 开始播种...');

  // ==================== 1. 默认角色 ====================
  const roles = [
    {
      name: 'superadmin',
      displayName: '超级管理员',
      permissions: ['*'],
      description: '拥有全部权限',
    },
    {
      name: 'admin',
      displayName: '管理员',
      permissions: [
        'user:view', 'user:manage',
        'trade:view', 'trade:manage',
        'fund:view', 'fund:manage',
        'content:view', 'content:manage',
        'role:view', 'admin:view',
      ],
      description: '用户管理+交易管理+资金管理+内容管理',
    },
    {
      name: 'operator',
      displayName: '运营',
      permissions: ['content:view', 'content:manage', 'report:view'],
      description: '内容管理+报表查看',
    },
    {
      name: 'finance',
      displayName: '财务',
      permissions: ['fund:view', 'fund:manage', 'report:view'],
      description: '资金管理+报表查看',
    },
    {
      name: 'risk',
      displayName: '风控',
      permissions: ['risk:view', 'risk:manage', 'trade:view'],
      description: '风控管理+交易管理查看',
    },
    {
      name: 'support',
      displayName: '客服',
      permissions: ['ticket:view', 'ticket:manage', 'chat:view', 'chat:manage'],
      description: '工单管理+客服聊天',
    },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: role,
      create: role,
    });
  }
  console.log('✅ 角色数据已初始化');

  // ==================== 2. 用户等级 ====================
  const levels = [
    { name: 'bronze', displayName: '铜牌', minDeposit: 0, feeDiscount: 1.0, leverageMax: 200, description: '累计入金 0+，无折扣' },
    { name: 'silver', displayName: '银牌', minDeposit: 10000, feeDiscount: 0.95, leverageMax: 200, description: '累计入金 10000+，手续费 95 折' },
    { name: 'gold', displayName: '金牌', minDeposit: 50000, feeDiscount: 0.90, leverageMax: 200, description: '累计入金 50000+，手续费 9 折' },
    { name: 'platinum', displayName: '铂金', minDeposit: 200000, feeDiscount: 0.85, leverageMax: 200, description: '累计入金 200000+，手续费 85 折' },
    { name: 'diamond', displayName: '钻石', minDeposit: 500000, feeDiscount: 0.80, leverageMax: 200, description: '累计入金 500000+，手续费 8 折' },
  ];

  for (const level of levels) {
    await prisma.userLevel.upsert({
      where: { name: level.name },
      update: level,
      create: level,
    });
  }
  console.log('✅ 用户等级数据已初始化');

  // ==================== 3. 交易品种 ====================
  const symbols = [
    {
      symbol: 'XAUUSD',
      name: '伦敦金',
      category: 'precious_metal',
      contractUnit: 100,
      contractUnitDesc: '1手=100盎司',
      minLots: 0.01,
      maxLots: 50,
      maxPositionLots: 200,
      leverageMin: 1,
      leverageMax: 200,
      spreadType: 'fixed',
      spreadValue: 3.5,
      commissionType: 'per_lot',
      commissionValue: 50,
      commissionSide: 'single',
      swapLong: -0.000150,
      swapShort: 0.000050,
      swapTime: '05:00',
      swapTripleDay: 3,
      tradingHoursStart: '00:00',
      tradingHoursEnd: '23:59',
      maxSlippage: 2.0,
      pricePrecision: 2,
      sortOrder: 1,
    },
    {
      symbol: 'XAGUSD',
      name: '伦敦银',
      category: 'precious_metal',
      contractUnit: 5000,
      contractUnitDesc: '1手=5000盎司',
      minLots: 0.01,
      maxLots: 50,
      maxPositionLots: 200,
      leverageMin: 1,
      leverageMax: 100,
      spreadType: 'fixed',
      spreadValue: 0.03,
      commissionType: 'per_lot',
      commissionValue: 50,
      commissionSide: 'single',
      swapLong: -0.000120,
      swapShort: 0.000040,
      swapTime: '05:00',
      swapTripleDay: 3,
      tradingHoursStart: '00:00',
      tradingHoursEnd: '23:59',
      maxSlippage: 0.02,
      pricePrecision: 3,
      sortOrder: 2,
    },
    {
      symbol: 'WTIUSD',
      name: '美原油',
      category: 'energy',
      contractUnit: 1000,
      contractUnitDesc: '1手=1000桶',
      minLots: 0.01,
      maxLots: 50,
      maxPositionLots: 200,
      leverageMin: 1,
      leverageMax: 100,
      spreadType: 'fixed',
      spreadValue: 0.05,
      commissionType: 'per_lot',
      commissionValue: 50,
      commissionSide: 'single',
      swapLong: -0.000180,
      swapShort: 0.000060,
      swapTime: '05:00',
      swapTripleDay: 3,
      tradingHoursStart: '06:00',
      tradingHoursEnd: '05:00',
      maxSlippage: 0.03,
      pricePrecision: 2,
      sortOrder: 3,
    },
  ];

  for (const sym of symbols) {
    await prisma.tradingSymbol.upsert({
      where: { symbol: sym.symbol },
      update: sym,
      create: sym,
    });
  }
  console.log('✅ 交易品种数据已初始化');

  // ==================== 4. 默认管理员 ====================
  const superadminRole = await prisma.role.findUnique({ where: { name: 'superadmin' } });
  if (superadminRole) {
    const passwordHash = await argon2.hash('Admin@123456', {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    await prisma.admin.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        username: 'admin',
        passwordHash,
        realName: '超级管理员',
        roleId: superadminRole.id,
      },
    });
    console.log('✅ 默认管理员已初始化 (admin / Admin@123456)');
  }

  // ==================== 5. 系统配置 ====================
  const systemConfigs = [
    { configKey: 'min_deposit_amount', configValue: '100', description: '最低入金金额', category: 'payment' },
    { configKey: 'max_withdraw_amount', configValue: '500000', description: '单笔最大出金金额', category: 'payment' },
    { configKey: 'withdraw_fee_type', configValue: 'fixed', description: '出金手续费类型', category: 'payment' },
    { configKey: 'withdraw_fee_value', configValue: '0', description: '出金手续费值', category: 'payment' },
    { configKey: 'max_alerts_per_user', configValue: '20', description: '每用户最大预警数', category: 'trading' },
    { configKey: 'platform_name', configValue: '寰球汇金交易所', description: '平台名称', category: 'general' },
  ];

  for (const cfg of systemConfigs) {
    await prisma.systemConfig.upsert({
      where: { configKey: cfg.configKey },
      update: cfg,
      create: cfg,
    });
  }
  console.log('✅ 系统配置已初始化');

  // ==================== 6. 风控配置 ====================
  const riskConfigs = [
    { configKey: 'margin_warning_ratio', configValue: '100', description: '保证金预警比例(%)', category: 'margin' },
    { configKey: 'force_close_ratio', configValue: '50', description: '强平保证金比例(%)', category: 'force_close' },
    { configKey: 'overnight_settlement_time', configValue: '05:00', description: '隔夜费结算时间', category: 'general' },
    { configKey: 'overnight_triple_day', configValue: '3', description: '三倍隔夜费星期几(3=周三)', category: 'general' },
  ];

  for (const cfg of riskConfigs) {
    await prisma.riskConfig.upsert({
      where: { configKey: cfg.configKey },
      update: cfg,
      create: cfg,
    });
  }
  console.log('✅ 风控配置已初始化');

  console.log('\n🎉 所有种子数据播种完成！');
}

seed()
  .catch((e) => {
    console.error('❌ 种子数据播种失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
