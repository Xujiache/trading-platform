import request from '../utils/request';

/**
 * 公告管理 API
 */
export function getAnnouncements(params?: Record<string, any>) {
  return request.get('/notification/announcements', { params });
}

export function createAnnouncement(data: Record<string, any>) {
  return request.post('/notification/announcements', data);
}

export function updateAnnouncement(id: number, data: Record<string, any>) {
  return request.put(`/notification/announcements/${id}`, data);
}

export function deleteAnnouncement(id: number) {
  return request.delete(`/notification/announcements/${id}`);
}

/**
 * 帮助文档 API
 */
export function getHelpArticles(params?: Record<string, any>) {
  return request.get('/ticket/help', { params });
}

export function createHelpArticle(data: Record<string, any>) {
  return request.post('/ticket/help', data);
}

export function updateHelpArticle(id: number, data: Record<string, any>) {
  return request.put(`/ticket/help/${id}`, data);
}

export function deleteHelpArticle(id: number) {
  return request.delete(`/ticket/help/${id}`);
}

/**
 * 活动管理 API
 */
export function getActivities(params?: Record<string, any>) {
  return request.get('/activity', { params });
}

export function createActivity(data: Record<string, any>) {
  return request.post('/activity', data);
}

export function updateActivity(id: number, data: Record<string, any>) {
  return request.put(`/activity/${id}`, data);
}

export function deleteActivity(id: number) {
  return request.delete(`/activity/${id}`);
}

export function updateActivityStatus(id: number, data: { status: string }) {
  return request.put(`/activity/${id}/status`, data);
}

/**
 * Banner 管理 API
 */
export function getBanners(params?: Record<string, any>) {
  return request.get('/homepage/banners', { params });
}

export function createBanner(data: Record<string, any>) {
  return request.post('/homepage/banners', data);
}

export function updateBanner(id: number, data: Record<string, any>) {
  return request.put(`/homepage/banners/${id}`, data);
}

export function deleteBanner(id: number) {
  return request.delete(`/homepage/banners/${id}`);
}

/**
 * 奖励卡片 API
 */
export function getRewardCards(params?: Record<string, any>) {
  return request.get('/homepage/reward-cards', { params });
}

export function createRewardCard(data: Record<string, any>) {
  return request.post('/homepage/reward-cards', data);
}

export function updateRewardCard(id: number, data: Record<string, any>) {
  return request.put(`/homepage/reward-cards/${id}`, data);
}

export function deleteRewardCard(id: number) {
  return request.delete(`/homepage/reward-cards/${id}`);
}
