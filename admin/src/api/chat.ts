import request from '../utils/request';

/**
 * 获取客服会话列表
 */
export function getChatSessions(params?: Record<string, any>) {
  return request.get('/chat/sessions', { params });
}

/**
 * 获取会话消息列表
 */
export function getSessionMessages(sessionId: number, params?: Record<string, any>) {
  return request.get(`/chat/sessions/${sessionId}/messages`, { params });
}

/**
 * 接单/分配会话
 */
export function assignSession(sessionId: number, data?: { adminId?: number }) {
  return request.post(`/chat/sessions/${sessionId}/assign`, data || {});
}

/**
 * 关闭会话
 */
export function closeSession(sessionId: number) {
  return request.put(`/chat/sessions/${sessionId}/close`);
}

/**
 * 获取未读消息数
 */
export function getChatUnreadCount() {
  return request.get('/chat/unread-count');
}
