import { AppRouteRecord } from '@/types/router'

export const fundRoutes: AppRouteRecord = {
  path: '/fund',
  name: 'Fund',
  component: '/index/index',
  meta: {
    title: '资金管理',
    icon: 'ri:money-dollar-circle-line',
    roles: ['R_SUPER', 'R_ADMIN']
  },
  children: [
    {
      path: 'deposits',
      name: 'FundDeposits',
      component: '/fund/deposits',
      meta: {
        title: '入金管理',
        icon: 'ri:add-circle-line',
        keepAlive: true
      }
    },
    {
      path: 'withdraws',
      name: 'FundWithdraws',
      component: '/fund/withdraws',
      meta: {
        title: '出金管理',
        icon: 'ri:subtract-line',
        keepAlive: true
      }
    },
    {
      path: 'flows',
      name: 'FundFlows',
      component: '/fund/flows',
      meta: {
        title: '资金流水',
        icon: 'ri:exchange-line',
        keepAlive: true
      }
    },
    {
      path: 'statistics',
      name: 'FundStatistics',
      component: '/fund/statistics',
      meta: {
        title: '财务统计',
        icon: 'ri:bar-chart-2-line',
        keepAlive: true
      }
    }
  ]
}
