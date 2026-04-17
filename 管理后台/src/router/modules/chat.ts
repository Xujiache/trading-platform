import { AppRouteRecord } from '@/types/router'

export const chatRoutes: AppRouteRecord = {
  path: '/chat',
  name: 'Chat',
  component: '/index/index',
  meta: {
    title: '在线客服',
    icon: 'ri:chat-3-line',
    roles: ['R_SUPER', 'R_ADMIN']
  },
  children: [
    {
      path: 'conversations',
      name: 'ChatConversations',
      component: '/chat/conversations',
      meta: {
        title: '会话管理',
        icon: 'ri:message-3-line',
        keepAlive: true
      }
    },
    {
      path: 'admin-manage',
      name: 'AdminManage',
      component: '/chat/admin-manage',
      meta: {
        title: '管理员管理',
        icon: 'ri:admin-line',
        keepAlive: true
      }
    }
  ]
}
