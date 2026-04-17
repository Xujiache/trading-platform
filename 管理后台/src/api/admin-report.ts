import request from '@/utils/http'

export interface ReportDateParams {
  startDate?: string
  endDate?: string
}

export function fetchOperationsOverview(params?: ReportDateParams) {
  return request.get<any>({ url: '/api/admin/report/operations', params })
}

export function fetchRiskReport(params?: ReportDateParams) {
  return request.get<any>({ url: '/api/admin/report/risk', params })
}

export function fetchUserAnalysis(params?: ReportDateParams) {
  return request.get<any>({ url: '/api/admin/report/user-analysis', params })
}
