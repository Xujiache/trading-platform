/**
 * 权限标识常量定义
 */
export const PERMISSIONS = {
  USER_VIEW: 'user:view',
  USER_MANAGE: 'user:manage',
  TRADE_VIEW: 'trade:view',
  TRADE_MANAGE: 'trade:manage',
  FUND_VIEW: 'fund:view',
  FUND_MANAGE: 'fund:manage',
  RISK_VIEW: 'risk:view',
  RISK_MANAGE: 'risk:manage',
  REPORT_VIEW: 'report:view',
  ROLE_VIEW: 'role:view',
  ROLE_MANAGE: 'role:manage',
  ADMIN_VIEW: 'admin:view',
  ADMIN_MANAGE: 'admin:manage',
  CONTENT_VIEW: 'content:view',
  CONTENT_MANAGE: 'content:manage',
  SYSTEM_VIEW: 'system:view',
  SYSTEM_MANAGE: 'system:manage',
  CHAT_VIEW: 'chat:view',
  CHAT_MANAGE: 'chat:manage',
} as const;

/**
 * 所有权限列表（用于角色管理页面展示）
 */
export const PERMISSION_LIST = [
  { group: '用户管理', items: [
    { value: 'user:view', label: '查看用户' },
    { value: 'user:manage', label: '管理用户' },
  ]},
  { group: '交易管理', items: [
    { value: 'trade:view', label: '查看交易' },
    { value: 'trade:manage', label: '管理交易' },
  ]},
  { group: '资金管理', items: [
    { value: 'fund:view', label: '查看资金' },
    { value: 'fund:manage', label: '管理资金' },
  ]},
  { group: '风控管理', items: [
    { value: 'risk:view', label: '查看风控' },
    { value: 'risk:manage', label: '管理风控' },
  ]},
  { group: '报表统计', items: [
    { value: 'report:view', label: '查看报表' },
  ]},
  { group: '内容管理', items: [
    { value: 'content:view', label: '查看内容' },
    { value: 'content:manage', label: '管理内容' },
  ]},
  { group: '系统管理', items: [
    { value: 'system:view', label: '查看系统配置' },
    { value: 'system:manage', label: '管理系统配置' },
    { value: 'role:view', label: '查看角色' },
    { value: 'role:manage', label: '管理角色' },
    { value: 'admin:view', label: '查看管理员' },
    { value: 'admin:manage', label: '管理管理员' },
  ]},
  { group: '客服管理', items: [
    { value: 'chat:view', label: '查看客服' },
    { value: 'chat:manage', label: '管理客服' },
  ]},
];
