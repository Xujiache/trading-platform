/**
 * 示例/模板专用 Mock API
 * 仅供 _examples 目录下的演示页面使用，不用于正式业务
 * 正式用户管理请使用 admin-users.ts，角色管理请使用 admin-role.ts
 */

import { AppRouteRecord } from '@/types/router'
import { asyncRoutes } from '@/router/routes/asyncRoutes'

/** 示例用户列表（本地 mock，不发起真实请求） */
export function fetchGetUserList(_params: Api.SystemManage.UserSearchParams) {
  const mockUsers: Api.SystemManage.UserListItem[] = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    avatar: '',
    status: '1',
    userName: `DemoUser${i + 1}`,
    nickName: `Demo${i + 1}`,
    userGender: i % 2 === 0 ? '男' : '女',
    userPhone: `138****${String(1000 + i).slice(-4)}`,
    userEmail: `demo${i + 1}@example.com`,
    userRoles: ['R_USER'],
    createBy: 'system',
    createTime: '2024-01-01 00:00:00',
    updateBy: 'system',
    updateTime: '2024-01-01 00:00:00',
  }))

  return Promise.resolve({
    records: mockUsers,
    current: 1,
    size: 20,
    total: mockUsers.length,
  })
}

/** 示例角色列表（本地 mock，不发起真实请求） */
export function fetchGetRoleList(_params: Api.SystemManage.RoleSearchParams) {
  return Promise.resolve({
    records: [],
    current: 1,
    size: 20,
    total: 0,
  })
}

/** 示例菜单列表（直接使用前端路由数据，不发起真实请求） */
export function fetchGetMenuList(): Promise<AppRouteRecord[]> {
  return Promise.resolve([...asyncRoutes])
}
