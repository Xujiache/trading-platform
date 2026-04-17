import { AppRouteRecord } from '@/types/router'

export const tradingUserRoutes: AppRouteRecord = {
  path: '/trading-user',
  name: 'TradingUser',
  component: '/index/index',
  meta: {
    title: '用户管理',
    icon: 'ri:user-settings-line',
    roles: ['R_SUPER', 'R_ADMIN']
  },
  children: [
    {
      path: 'list',
      name: 'TradingUserList',
      component: '/trading-user/list',
      meta: {
        title: '用户列表',
        icon: 'ri:user-line',
        keepAlive: true
      }
    },
    {
      path: 'kyc-review',
      name: 'KycReview',
      component: '/trading-user/kyc-review',
      meta: {
        title: 'KYC审核',
        icon: 'ri:shield-check-line',
        keepAlive: true
      }
    },
    {
      path: 'detail/:id',
      name: 'TradingUserDetail',
      component: '/trading-user/detail',
      meta: {
        title: '用户详情',
        icon: 'ri:user-search-line',
        hideInMenu: true
      }
    }
  ]
}
