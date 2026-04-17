import request from '@/utils/http'

export interface HealthData {
  timestamp: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  components: {
    database: { status: string; latencyMs?: number; pool?: { total: number; idle: number; waiting: number }; error?: string }
    redis: { status: string; latencyMs?: number; connectedClients?: number; error?: string }
    marketMonitor: {
      isRunning: boolean; startedAt: string | null; lastUpdateTime: string | null
      staleDurationMs: number | null; isHealthy: boolean; restartAttempts: number
      recentRecoveries: Array<{ time: string; result: string; error?: string }>
    }
    system: { uptime: number; memoryUsage: Record<string, number>; nodeVersion: string; platform: string; pid: number }
  }
}

export interface ConnectionData {
  database: { total: number; idle: number; active: number; waiting: number; config: { connectionLimit: number } }
  redis: { status: string; connectedClients: number; blockedClients: number; usedMemory: string; error?: string }
}

export interface AuditLogItem {
  id: number
  operator_type: string
  operator_id: number | null
  operator_name: string
  module: string
  action: string
  target_type: string
  target_id: string
  content: string
  ip: string
  status: string
  error_message: string | null
  duration_ms: number | null
  created_at: string
}

export interface AuditLogDetail extends AuditLogItem {
  user_agent: string
  before_data: string | null
  after_data: string | null
}

export interface ExportType {
  type: string
  filename: string
  fieldCount: number
}

export interface BatchResult {
  success: number[]
  failed: Array<{ id: number; reason: string }>
}

export function fetchSystemHealth() {
  return request.get<HealthData>({ url: '/api/admin/system/health' })
}

export function fetchSimpleHealth() {
  return request.get<{ status: string; database: string; redis: string; timestamp: string }>({ url: '/api/admin/health' })
}

export function fetchConnectionStatus() {
  return request.get<ConnectionData>({ url: '/api/admin/monitor/connections' })
}

export function fetchAuditLogs(params?: {
  module?: string; action?: string; operator_name?: string; status?: string
  start_date?: string; end_date?: string; target_type?: string; page?: number; pageSize?: number
}) {
  return request.get<{ list: AuditLogItem[]; pagination: { total: number; page: number; pageSize: number; totalPages: number } }>({
    url: '/api/admin/audit-logs',
    params,
  })
}

export function fetchAuditLogModules() {
  return request.get<{ modules: string[]; actions: string[] }>({ url: '/api/admin/audit-logs/modules' })
}

export function fetchAuditLogDetail(id: number) {
  return request.get<AuditLogDetail>({ url: `/api/admin/audit-logs/${id}` })
}

export function fetchExportTypes() {
  return request.get<ExportType[]>({ url: '/api/admin/export-types' })
}

export function exportCsv(type: string, params?: { start_date?: string; end_date?: string; status?: string; user_id?: number }) {
  return request.get({
    url: `/api/admin/export/${type}`,
    params,
    responseType: 'blob',
  })
}

export function batchDepositConfirm(ids: number[], remark?: string) {
  return request.post<BatchResult>({ url: '/api/admin/batch/deposit-confirm', data: { ids, remark } })
}

export function batchWithdrawAudit(ids: number[], action: 'approve' | 'reject' | 'complete', remark?: string) {
  return request.post<BatchResult>({ url: '/api/admin/batch/withdraw-audit', data: { ids, action, remark } })
}

export function batchUserStatus(ids: number[], action: 'freeze' | 'unfreeze', reason?: string) {
  return request.post<BatchResult>({ url: '/api/admin/batch/user-status', data: { ids, action, reason } })
}
