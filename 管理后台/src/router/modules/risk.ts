import { AppRouteRecord } from '@/types/router'

export const riskRoutes: AppRouteRecord = {
  path: '/trading',
  name: 'TradingRisk',
  component: '/index/index',
  meta: {
    title: '风控管理',
    icon: 'ri:shield-star-line',
    roles: ['R_SUPER', 'R_ADMIN']
  },
  children: [
    {
      path: 'risk',
      name: 'RiskManage',
      component: '/trading/risk-manage',
      meta: {
        title: '风控中心',
        icon: 'ri:alarm-warning-line',
        keepAlive: true
      }
    },
    {
      path: 'notification',
      name: 'NotificationManage',
      component: '/trading/notification',
      meta: {
        title: '消息公告',
        icon: 'ri:notification-3-line',
        keepAlive: true
      }
    },
    {
      path: 'ticket',
      name: 'TicketManage',
      component: '/trading/ticket',
      meta: {
        title: '工单帮助',
        icon: 'ri:customer-service-2-line',
        keepAlive: true
      }
    }
  ]
}
