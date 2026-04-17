import { AppRouteRecord } from '@/types/router'

export const systemRoutes: AppRouteRecord = {
  path: '/system',
  name: 'System',
  component: '/index/index',
  meta: {
    title: 'menus.system.title',
    icon: 'ri:settings-3-line',
    roles: ['R_SUPER', 'R_ADMIN']
  },
  children: [
    {
      path: 'role',
      name: 'Role',
      component: '/system/role',
      meta: {
        title: '角色管理',
        icon: 'ri:user-settings-line',
        keepAlive: true,
        roles: ['R_SUPER']
      }
    },
    {
      path: 'log',
      name: 'OperationLog',
      component: '/system/log',
      meta: {
        title: '操作日志',
        icon: 'ri:file-list-3-line',
        keepAlive: true,
        roles: ['R_SUPER']
      }
    },
    {
      path: 'config',
      name: 'SystemConfig',
      component: '/system/config',
      meta: {
        title: '系统配置',
        icon: 'ri:tools-line',
        keepAlive: true,
        roles: ['R_SUPER']
      }
    },
    {
      path: 'email',
      name: 'EmailConfig',
      component: '/system/email',
      meta: {
        title: '邮箱配置',
        icon: 'ri:mail-settings-line',
        keepAlive: true,
        roles: ['R_SUPER']
      }
    },
    {
      path: 'user-center',
      name: 'UserCenter',
      component: '/system/user-center',
      meta: {
        title: '个人中心',
        icon: 'ri:user-line',
        isHide: true,
        keepAlive: true,
        isHideTab: true
      }
    },
    {
      path: 'splash-ad',
      name: 'SplashAd',
      component: '/system/splash-ad',
      meta: {
        title: '开屏广告',
        icon: 'ri:advertisement-line',
        keepAlive: true,
        roles: ['R_SUPER']
      }
    },
    {
      path: 'health',
      name: 'SystemHealth',
      component: '/system/health',
      meta: {
        title: '系统监控',
        icon: 'ri:heart-pulse-line',
        keepAlive: false,
        roles: ['R_SUPER']
      }
    },
    {
      path: 'audit-log',
      name: 'AuditLog',
      component: '/system/audit-log',
      meta: {
        title: '审计日志',
        icon: 'ri:shield-check-line',
        keepAlive: true,
        roles: ['R_SUPER']
      }
    },
    {
      path: 'export',
      name: 'DataExport',
      component: '/system/export',
      meta: {
        title: '数据导出',
        icon: 'ri:download-2-line',
        keepAlive: true,
        roles: ['R_SUPER', 'R_ADMIN']
      }
    },
    {
      path: 'batch',
      name: 'BatchOperation',
      component: '/system/batch',
      meta: {
        title: '批量操作',
        icon: 'ri:stack-line',
        keepAlive: true,
        roles: ['R_SUPER', 'R_ADMIN']
      }
    }
  ]
}
