import request from '@/utils/http'

export interface LogItem {
  id: number
  admin_id: number
  admin_username: string
  module: string
  action: string
  content: string
  ip: string
  user_agent: string
  status: string
  error_message: string
  created_at: string
}

export interface LogListResult {
  list: LogItem[]
  pagination: { total: number; page: number; pageSize: number; totalPages: number }
}

export function fetchLogList(params?: {
  module?: string
  admin_username?: string
  status?: string
  start_date?: string
  end_date?: string
  page?: number
  pageSize?: number
}) {
  return request.get<LogListResult>({
    url: '/api/admin/logs',
    params,
  })
}

export function fetchLogModules() {
  return request.get<string[]>({
    url: '/api/admin/logs/modules',
  })
}

export function fetchLogDetail(id: number) {
  return request.get<LogItem>({
    url: `/api/admin/logs/${id}`,
  })
}
