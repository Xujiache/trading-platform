import request from '@/utils/http'

// ==================== Banner ====================

export function fetchBanners(params?: { page?: number; pageSize?: number; status?: string; position?: string }) {
  return request.get<any>({ url: '/api/admin/banners', params })
}

export function createBanner(data: Record<string, any>) {
  return request.post<any>({ url: '/api/admin/banners', data, showSuccessMessage: true })
}

export function updateBanner(id: number, data: Record<string, any>) {
  return request.put<any>({ url: `/api/admin/banners/${id}`, data, showSuccessMessage: true })
}

export function deleteBanner(id: number) {
  return request.del<any>({ url: `/api/admin/banners/${id}`, showSuccessMessage: true })
}

// ==================== 奖励卡片 ====================

export function fetchRewardCards(params?: { page?: number; pageSize?: number; status?: string; reward_type?: string }) {
  return request.get<any>({ url: '/api/admin/reward-cards', params })
}

export function createRewardCard(data: Record<string, any>) {
  return request.post<any>({ url: '/api/admin/reward-cards', data, showSuccessMessage: true })
}

export function updateRewardCard(id: number, data: Record<string, any>) {
  return request.put<any>({ url: `/api/admin/reward-cards/${id}`, data, showSuccessMessage: true })
}

export function deleteRewardCard(id: number) {
  return request.del<any>({ url: `/api/admin/reward-cards/${id}`, showSuccessMessage: true })
}

// ==================== 活动 ====================

export function fetchActivities(params?: { page?: number; pageSize?: number; status?: string; activity_type?: string; keyword?: string }) {
  return request.get<any>({ url: '/api/admin/activities', params })
}

export function fetchActivityDetail(id: number) {
  return request.get<any>({ url: `/api/admin/activities/${id}` })
}

export function fetchActivityStats() {
  return request.get<any>({ url: '/api/admin/activity-stats' })
}

export function createActivity(data: Record<string, any>) {
  return request.post<any>({ url: '/api/admin/activities', data, showSuccessMessage: true })
}

export function updateActivity(id: number, data: Record<string, any>) {
  return request.put<any>({ url: `/api/admin/activities/${id}`, data, showSuccessMessage: true })
}

export function deleteActivity(id: number) {
  return request.del<any>({ url: `/api/admin/activities/${id}`, showSuccessMessage: true })
}

// ==================== 模拟盘费用 ====================

export function fetchDemoFeeConfigs() {
  return request.get<any>({ url: '/api/admin/demo-fee' })
}

export function saveDemoFeeConfig(data: Record<string, any>) {
  return request.post<any>({ url: '/api/admin/demo-fee', data, showSuccessMessage: true })
}

export function resetDemoFee(symbol: string) {
  return request.post<any>({ url: `/api/admin/demo-fee/reset/${symbol}`, showSuccessMessage: true })
}

export function syncAllDemoFee() {
  return request.post<any>({ url: '/api/admin/demo-fee/sync-all', showSuccessMessage: true })
}

// ==================== 第三方接口 ====================

export function fetchIntegrations(params?: { page?: number; pageSize?: number; type?: string; status?: string }) {
  return request.get<any>({ url: '/api/admin/integrations', params })
}

export function fetchIntegrationDetail(id: number) {
  return request.get<any>({ url: `/api/admin/integrations/${id}` })
}

export function createIntegration(data: Record<string, any>) {
  return request.post<any>({ url: '/api/admin/integrations', data, showSuccessMessage: true })
}

export function updateIntegration(id: number, data: Record<string, any>) {
  return request.put<any>({ url: `/api/admin/integrations/${id}`, data, showSuccessMessage: true })
}

export function deleteIntegration(id: number) {
  return request.del<any>({ url: `/api/admin/integrations/${id}`, showSuccessMessage: true })
}

export function checkIntegration(id: number) {
  return request.post<any>({ url: `/api/admin/integrations/${id}/check` })
}

// ==================== 开屏广告 ====================

export function fetchSplashAdConfig() {
  return request.get<any>({ url: '/api/admin/splash-ad' })
}

export function saveSplashAdConfig(data: Record<string, any>) {
  return request.post<any>({ url: '/api/admin/splash-ad', data, showSuccessMessage: true })
}
