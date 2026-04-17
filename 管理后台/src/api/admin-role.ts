import request from '@/utils/http'

export interface RoleItem {
  id: number
  name: string
  display_name: string
  description: string
  permissions: string[]
  is_system: number
  status: number
  sort_order: number
  created_at: string
  updated_at: string
}

export interface RoleListResult {
  list: RoleItem[]
  pagination: { total: number; page: number; pageSize: number; totalPages: number }
}

export function fetchRoleList(params?: { keyword?: string; page?: number; pageSize?: number }) {
  return request.get<RoleListResult>({
    url: '/api/admin/roles',
    params,
  })
}

export function fetchRoleDetail(id: number) {
  return request.get<RoleItem>({
    url: `/api/admin/roles/${id}`,
  })
}

export function createRole(params: Partial<RoleItem>) {
  return request.post({
    url: '/api/admin/roles',
    params,
  })
}

export function updateRole(id: number, params: Partial<RoleItem>) {
  return request.put({
    url: `/api/admin/roles/${id}`,
    params,
  })
}

export function deleteRole(id: number) {
  return request.del({
    url: `/api/admin/roles/${id}`,
  })
}
