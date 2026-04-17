import request from '@/utils/http'

/** 获取风控参数 */
export function fetchRiskConfig() {
  return request.get<any>({ url: '/api/admin/risk/config' })
}

/** 更新风控参数 */
export function updateRiskConfig(data: Record<string, any>) {
  return request.put<any>({ url: '/api/admin/risk/config', data, showSuccessMessage: true })
}

/** 预警列表 */
export function fetchRiskAlerts(params: any) {
  return request.get<any>({ url: '/api/admin/risk/alerts', params })
}

/** 处理预警 */
export function processRiskAlert(id: number, data: { action: string; remark?: string }) {
  return request.post<any>({ url: `/api/admin/risk/alerts/${id}/process`, data, showSuccessMessage: true })
}

/** 强平记录 */
export function fetchForceCloseRecords(params: any) {
  return request.get<any>({ url: '/api/admin/risk/force-close', params })
}

/** 手动强平 */
export function forceCloseUser(userId: number) {
  return request.post<any>({ url: `/api/admin/risk/force-close/${userId}`, showSuccessMessage: true })
}

/** 高风险监控 */
export function fetchRiskMonitor() {
  return request.get<any>({ url: '/api/admin/risk/monitor' })
}

/** AML记录 */
export function fetchAmlRecords(params: any) {
  return request.get<any>({ url: '/api/admin/risk/aml', params })
}
