import request from '@/utils/http'

/** 工单列表 */
export function fetchTickets(params: any) {
  return request.get<any>({ url: '/api/admin/ticket/list', params })
}

/** 工单详情 */
export function fetchTicketDetail(id: number) {
  return request.get<any>({ url: `/api/admin/ticket/${id}` })
}

/** 回复工单 */
export function replyTicket(id: number, data: { reply_content: string }) {
  return request.post<any>({ url: `/api/admin/ticket/${id}/reply`, data, showSuccessMessage: true })
}

/** 标记已解决 */
export function resolveTicket(id: number) {
  return request.put<any>({ url: `/api/admin/ticket/${id}/resolve`, showSuccessMessage: true })
}

/** 关闭工单 */
export function closeTicket(id: number) {
  return request.put<any>({ url: `/api/admin/ticket/${id}/close`, showSuccessMessage: true })
}

/** 帮助文档列表 */
export function fetchHelpDocs(params: any) {
  return request.get<any>({ url: '/api/admin/help/list', params })
}

/** 创建帮助文档 */
export function createHelpDoc(data: any) {
  return request.post<any>({ url: '/api/admin/help', data, showSuccessMessage: true })
}

/** 编辑帮助文档 */
export function updateHelpDoc(id: number, data: any) {
  return request.put<any>({ url: `/api/admin/help/${id}`, data, showSuccessMessage: true })
}

/** 删除帮助文档 */
export function deleteHelpDoc(id: number) {
  return request.del<any>({ url: `/api/admin/help/${id}`, showSuccessMessage: true })
}
