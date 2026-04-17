import { AppRouteRecord } from '@/types/router'

export const reportRoutes: AppRouteRecord = {
  path: '/report',
  name: 'Report',
  component: '/index/index',
  meta: {
    title: '运营报表',
    icon: 'ri:line-chart-line',
    roles: ['R_SUPER', 'R_ADMIN']
  },
  children: [
    {
      path: 'operations',
      name: 'ReportOperations',
      component: '/report/operations',
      meta: {
        title: '运营概览',
        icon: 'ri:dashboard-3-line',
        keepAlive: true
      }
    },
    {
      path: 'risk',
      name: 'ReportRisk',
      component: '/report/risk',
      meta: {
        title: '风控报表',
        icon: 'ri:shield-check-line',
        keepAlive: true
      }
    },
    {
      path: 'user-analysis',
      name: 'ReportUserAnalysis',
      component: '/report/user-analysis',
      meta: {
        title: '用户分析',
        icon: 'ri:user-search-line',
        keepAlive: true
      }
    }
  ]
}
