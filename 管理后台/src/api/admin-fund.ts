import request from '@/utils/http'

export interface DepositSearchParams {
  page?: number
  pageSize?: number
  status?: string
  userId?: number
  startDate?: string
  endDate?: string
}

export interface WithdrawSearchParams {
  page?: number
  pageSize?: number
  status?: string
  userId?: number
  startDate?: string
  endDate?: string
}

export interface FundFlowSearchParams {
  page?: number
  pageSize?: number
  flowType?: string
  userId?: number
  startDate?: string
  endDate?: string
}

export function fetchDeposits(params: DepositSearchParams) {
  return request.get<any>({ url: '/api/admin/fund/deposits', params })
}

export function confirmDeposit(id: number, data?: { adminRemark?: string }) {
  return request.post<any>({ url: `/api/admin/fund/deposits/${id}/confirm`, data, showSuccessMessage: true })
}

export function rejectDeposit(id: number, data?: { adminRemark?: string }) {
  return request.post<any>({ url: `/api/admin/fund/deposits/${id}/reject`, data, showSuccessMessage: true })
}

export function fetchWithdraws(params: WithdrawSearchParams) {
  return request.get<any>({ url: '/api/admin/fund/withdraws', params })
}

export function approveWithdraw(id: number, data?: { adminRemark?: string }) {
  return request.post<any>({ url: `/api/admin/fund/withdraws/${id}/approve`, data, showSuccessMessage: true })
}

export function rejectWithdraw(id: number, data?: { adminRemark?: string }) {
  return request.post<any>({ url: `/api/admin/fund/withdraws/${id}/reject`, data, showSuccessMessage: true })
}

export function completeWithdraw(id: number, data?: { adminRemark?: string }) {
  return request.post<any>({ url: `/api/admin/fund/withdraws/${id}/complete`, data, showSuccessMessage: true })
}

export function fetchFundFlows(params: FundFlowSearchParams) {
  return request.get<any>({ url: '/api/admin/fund/flows', params })
}

export function fetchFinancialStatistics() {
  return request.get<any>({ url: '/api/admin/fund/statistics' })
}
