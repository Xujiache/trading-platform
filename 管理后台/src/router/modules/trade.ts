import { AppRouteRecord } from '@/types/router'

export const tradeRoutes: AppRouteRecord = {
  path: '/trade',
  name: 'Trade',
  component: '/index/index',
  meta: {
    title: '交易管理',
    icon: 'ri:exchange-line',
    roles: ['R_SUPER', 'R_ADMIN']
  },
  children: [
    {
      path: 'orders',
      name: 'TradeOrders',
      component: '/trade/orders',
      meta: {
        title: '订单管理',
        icon: 'ri:file-list-2-line',
        keepAlive: true
      }
    },
    {
      path: 'positions',
      name: 'TradePositions',
      component: '/trade/positions',
      meta: {
        title: '当前持仓',
        icon: 'ri:stock-line',
        keepAlive: true
      }
    },
    {
      path: 'flows',
      name: 'TradeFlows',
      component: '/trade/flows',
      meta: {
        title: '交易流水',
        icon: 'ri:money-dollar-circle-line',
        keepAlive: true
      }
    }
  ]
}
