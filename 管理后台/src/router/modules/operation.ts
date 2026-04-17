import { AppRouteRecord } from '@/types/router'

export const operationRoutes: AppRouteRecord = {
  path: '/operation',
  name: 'Operation',
  component: '/index/index',
  meta: {
    title: '运营管理',
    icon: 'ri:megaphone-line',
    roles: ['R_SUPER', 'R_ADMIN']
  },
  children: [
    {
      path: 'banners',
      name: 'OperationBanners',
      component: '/operation/banners',
      meta: {
        title: 'Banner管理',
        icon: 'ri:image-line',
        keepAlive: true
      }
    },
    {
      path: 'reward-cards',
      name: 'OperationRewardCards',
      component: '/operation/reward-cards',
      meta: {
        title: '奖励卡片',
        icon: 'ri:gift-line',
        keepAlive: true
      }
    },
    {
      path: 'activities',
      name: 'OperationActivities',
      component: '/operation/activities',
      meta: {
        title: '活动管理',
        icon: 'ri:calendar-event-line',
        keepAlive: true
      }
    },
    {
      path: 'demo-fee',
      name: 'OperationDemoFee',
      component: '/operation/demo-fee',
      meta: {
        title: '模拟盘费用',
        icon: 'ri:settings-3-line',
        keepAlive: true
      }
    },
    {
      path: 'integrations',
      name: 'OperationIntegrations',
      component: '/operation/integrations',
      meta: {
        title: '接口管理',
        icon: 'ri:plug-line',
        keepAlive: true
      }
    },
    {
      path: 'splash-ad',
      name: 'OperationSplashAd',
      component: '/operation/splash-ad',
      meta: {
        title: '开屏广告',
        icon: 'ri:fullscreen-line',
        keepAlive: true
      }
    }
  ]
}
