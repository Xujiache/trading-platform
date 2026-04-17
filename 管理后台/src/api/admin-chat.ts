import request from '@/utils/http'

/** 会话列表 */
export function fetchConversations(params: any) {
  return request.get<any>({ url: '/api/admin/chat/conversations', params })
}

/** 会话消息列表 */
export function fetchChatMessages(conversationId: number, params?: any) {
  return request.get<any>({ url: `/api/admin/chat/messages/${conversationId}`, params })
}

/** 发送消息 */
export function sendChatMessage(data: { conversation_id: number; content: string; msg_type?: string }) {
  return request.post<any>({ url: '/api/admin/chat/send', data })
}

/** 接入会话 */
export function assignConversation(data: { conversation_id: number }) {
  return request.post<any>({ url: '/api/admin/chat/assign', data, showSuccessMessage: true })
}

/** 关闭会话 */
export function closeConversation(data: { conversation_id: number }) {
  return request.post<any>({ url: '/api/admin/chat/close', data, showSuccessMessage: true })
}

/** 未读数 */
export function fetchChatUnread() {
  return request.get<any>({ url: '/api/admin/chat/unread' })
}

/** 管理员列表 */
export function fetchAdmins(params: any) {
  return request.get<any>({ url: '/api/admin/admins', params })
}

/** 新增管理员 */
export function createAdmin(data: any) {
  return request.post<any>({ url: '/api/admin/admins', data, showSuccessMessage: true })
}

/** 编辑管理员 */
export function updateAdmin(id: number, data: any) {
  return request.put<any>({ url: `/api/admin/admins/${id}`, data, showSuccessMessage: true })
}

/** 删除管理员 */
export function deleteAdmin(id: number) {
  return request.del<any>({ url: `/api/admin/admins/${id}`, showSuccessMessage: true })
}
