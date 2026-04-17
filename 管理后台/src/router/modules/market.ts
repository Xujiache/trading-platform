import { AppRouteRecord } from '@/types/router'

export const marketRoutes: AppRouteRecord = {
  path: '/market',
  name: 'Market',
  component: '/index/index',
  meta: {
    title: '行情管理',
    icon: 'ri:line-chart-line',
    roles: ['R_SUPER', 'R_ADMIN']
  },
  children: [
    {
      path: 'symbols',
      name: 'TradingSymbols',
      component: '/market/symbols',
      meta: {
        title: '品种管理',
        icon: 'ri:stock-line',
        keepAlive: true,
        roles: ['R_SUPER', 'R_ADMIN']
      }
    },
    {
      path: 'sim-monitor',
      name: 'SimMonitor',
      component: '/market/sim-monitor',
      meta: {
        title: '自控引擎监控',
        icon: 'ri:pulse-line',
        keepAlive: true,
        roles: ['R_SUPER', 'R_ADMIN']
      }
    }
  ]
}
