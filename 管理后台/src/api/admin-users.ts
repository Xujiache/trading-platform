import request from '@/utils/http'

export interface UserItem {
  id: number
  email: string
  nickname: string
  avatar: string
  real_name: string
  kyc_status: 'none' | 'pending' | 'approved' | 'rejected'
  risk_level: string
  account_type: 'real' | 'demo'
  account_status: 'active' | 'frozen'
  user_level: number
  two_factor_enabled: number
  login_count: number
  last_login_at: string | null
  created_at: string
  balance?: number
  frozen_margin?: number
  floating_pnl?: number
}

export interface UserSearchParams {
  page?: number
  pageSize?: number
  email?: string
  kycStatus?: string
  accountStatus?: string
  accountType?: string
}

/** 用户列表 */
export function fetchUsers(params: UserSearchParams) {
  return request.get<any>({ url: '/api/admin/users', params })
}

/** 用户详情 */
export function fetchUserDetail(id: number) {
  return request.get<any>({ url: `/api/admin/users/${id}` })
}

/** KYC审核 */
export function reviewKyc(id: number, data: { action: string; reason?: string }) {
  return request.post<any>({ url: `/api/admin/users/${id}/kyc-review`, data, showSuccessMessage: true })
}

/** 冻结/解冻 */
export function toggleUserStatus(id: number, data: { reason?: string }) {
  return request.post<any>({ url: `/api/admin/users/${id}/toggle-status`, data, showSuccessMessage: true })
}

/** 重置密码 */
export function resetUserPassword(id: number) {
  return request.post<any>({ url: `/api/admin/users/${id}/reset-password`, showSuccessMessage: true })
}
