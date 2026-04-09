import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/login/index.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/',
      component: () => import('../layouts/DefaultLayout.vue'),
      redirect: '/dashboard',
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('../views/dashboard/index.vue'),
          meta: { title: '数据看板' },
        },
        {
          path: 'user/list',
          name: 'UserList',
          component: () => import('../views/user/list.vue'),
          meta: { title: '用户列表', permission: 'user:view' },
        },
        {
          path: 'user/kyc',
          name: 'KycReview',
          component: () => import('../views/user/kyc.vue'),
          meta: { title: 'KYC审核', permission: 'user:manage' },
        },
        {
          path: 'system/roles',
          name: 'RoleManage',
          component: () => import('../views/system/roles.vue'),
          meta: { title: '角色管理', permission: 'role:view' },
        },
        {
          path: 'system/admins',
          name: 'AdminManage',
          component: () => import('../views/system/admins.vue'),
          meta: { title: '管理员管理', permission: 'admin:view' },
        },
        {
          path: 'system/symbols',
          name: 'SymbolManage',
          component: () => import('../views/system/symbols.vue'),
          meta: { title: '品种管理', permission: 'trade:view' },
        },
        {
          path: 'trade/orders',
          name: 'TradeOrders',
          component: () => import('../views/trade/orders.vue'),
          meta: { title: '订单列表', permission: 'trade:view' },
        },
        {
          path: 'trade/positions',
          name: 'TradePositions',
          component: () => import('../views/trade/positions.vue'),
          meta: { title: '持仓列表', permission: 'trade:view' },
        },
        {
          path: 'fund/deposit',
          name: 'FundDeposit',
          component: () => import('../views/fund/deposit.vue'),
          meta: { title: '入金管理', permission: 'fund:view' },
        },
        {
          path: 'fund/withdraw',
          name: 'FundWithdraw',
          component: () => import('../views/fund/withdraw.vue'),
          meta: { title: '出金管理', permission: 'fund:view' },
        },
        {
          path: 'fund/statistics',
          name: 'FundStatistics',
          component: () => import('../views/fund/statistics.vue'),
          meta: { title: '财务统计', permission: 'fund:view' },
        },
        {
          path: 'risk/config',
          name: 'RiskConfig',
          component: () => import('../views/risk/config.vue'),
          meta: { title: '风控参数', permission: 'risk:view' },
        },
        {
          path: 'risk/alerts',
          name: 'RiskAlerts',
          component: () => import('../views/risk/alerts.vue'),
          meta: { title: '风险预警', permission: 'risk:view' },
        },
        {
          path: 'risk/force-close',
          name: 'ForceCloseRecords',
          component: () => import('../views/risk/forceClose.vue'),
          meta: { title: '强平记录', permission: 'risk:view' },
        },
        {
          path: 'report/operation',
          name: 'OperationReport',
          component: () => import('../views/report/operation.vue'),
          meta: { title: '运营报表', permission: 'report:view' },
        },
        {
          path: 'report/user-analysis',
          name: 'UserAnalysis',
          component: () => import('../views/report/userAnalysis.vue'),
          meta: { title: '用户分析', permission: 'report:view' },
        },
        {
          path: 'user/detail/:id',
          name: 'UserDetail',
          component: () => import('../views/user/detail.vue'),
          meta: { title: '用户详情', permission: 'user:view' },
        },
        {
          path: 'trade/detail/:id',
          name: 'TradeDetail',
          component: () => import('../views/trade/detail.vue'),
          meta: { title: '订单详情', permission: 'trade:view' },
        },
        {
          path: 'fund/flows',
          name: 'FundFlows',
          component: () => import('../views/fund/flows.vue'),
          meta: { title: '资金流水', permission: 'fund:view' },
        },
        {
          path: 'risk/aml',
          name: 'AmlMonitor',
          component: () => import('../views/risk/aml.vue'),
          meta: { title: '反洗钱', permission: 'risk:view' },
        },
        {
          path: 'report/risk',
          name: 'RiskReport',
          component: () => import('../views/report/risk.vue'),
          meta: { title: '风控报表', permission: 'report:view' },
        },
        {
          path: 'content/announcements',
          name: 'Announcements',
          component: () => import('../views/content/announcements.vue'),
          meta: { title: '公告管理', permission: 'content:view' },
        },
        {
          path: 'content/help',
          name: 'HelpArticles',
          component: () => import('../views/content/help.vue'),
          meta: { title: '帮助文档', permission: 'content:view' },
        },
        {
          path: 'content/activities',
          name: 'Activities',
          component: () => import('../views/content/activities.vue'),
          meta: { title: '活动管理', permission: 'content:view' },
        },
        {
          path: 'content/banners',
          name: 'Banners',
          component: () => import('../views/content/banners.vue'),
          meta: { title: 'Banner管理', permission: 'content:view' },
        },
        {
          path: 'content/reward-cards',
          name: 'RewardCards',
          component: () => import('../views/content/rewardCards.vue'),
          meta: { title: '奖励卡片', permission: 'content:view' },
        },
        {
          path: 'system/logs',
          name: 'SystemLogs',
          component: () => import('../views/system/logs.vue'),
          meta: { title: '操作日志', permission: 'system:view' },
        },
        {
          path: 'system/config',
          name: 'SystemConfig',
          component: () => import('../views/system/config.vue'),
          meta: { title: '系统配置', permission: 'system:manage' },
        },
        {
          path: 'system/smtp',
          name: 'SmtpConfig',
          component: () => import('../views/system/smtp.vue'),
          meta: { title: 'SMTP配置', permission: 'system:manage' },
        },
        {
          path: 'system/integration',
          name: 'Integration',
          component: () => import('../views/system/integration.vue'),
          meta: { title: '第三方接口', permission: 'system:manage' },
        },
        {
          path: 'system/splash',
          name: 'SplashConfig',
          component: () => import('../views/system/splash.vue'),
          meta: { title: '启动屏广告', permission: 'content:manage' },
        },
        {
          path: 'chat',
          name: 'ChatManage',
          component: () => import('../views/chat/index.vue'),
          meta: { title: '客服管理', permission: 'chat:view' },
        },
      ],
    },
  ],
});

router.beforeEach((to, _from, next) => {
  if (to.meta.requiresAuth === false) {
    next();
    return;
  }
  const token = localStorage.getItem('adminToken');
  if (!token) {
    next('/login');
    return;
  }
  next();
});

export default router;
