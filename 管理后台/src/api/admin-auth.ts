import request from '@/utils/http'

export function adminLogin(params: { username: string; password: string }) {
  return request.post<{
    token: string
    refreshToken: string
    adminInfo: {
      id: number
      username: string
      realName: string
      email: string
      avatar: string
      roleName: string
      roleDisplayName: string
      permissions: string[]
    }
  }>({
    url: '/api/admin/auth/login',
    params,
  })
}

export function getAdminInfo() {
  return request.get<{
    id: number
    username: string
    real_name: string
    email: string
    phone: string
    avatar: string
    role_id: number
    role_name: string
    role_display_name: string
    permissions: string[]
    last_login_at: string
    created_at: string
  }>({
    url: '/api/admin/auth/info',
  })
}

/** 获取管理员信息并映射为 UserInfo 结构，供路由守卫使用 */
export async function fetchAdminUserInfo(): Promise<Api.Auth.UserInfo> {
  const data = await getAdminInfo()
  return {
    userId: data.id,
    userName: data.username,
    realName: data.real_name,
    email: data.email,
    avatar: data.avatar,
    roles: [data.role_name === 'super_admin' ? 'R_SUPER' : 'R_ADMIN'],
    permissions: data.permissions,
  }
}

export function changeAdminPassword(params: { oldPassword: string; newPassword: string }) {
  return request.post({
    url: '/api/admin/auth/change-password',
    params,
  })
}
