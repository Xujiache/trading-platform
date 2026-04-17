import request from '@/utils/http'

/** 通知列表 */
export function fetchNotifications(params: any) {
  return request.get<any>({ url: '/api/admin/notification/list', params })
}

/** 发送通知 */
export function sendNotification(data: { userId?: number; allUsers?: boolean; title: string; content: string; type?: string }) {
  return request.post<any>({ url: '/api/admin/notification/send', data, showSuccessMessage: true })
}

/** 公告列表 */
export function fetchAnnouncements(params: any) {
  return request.get<any>({ url: '/api/admin/announcement/list', params })
}

/** 创建公告 */
export function createAnnouncement(data: any) {
  return request.post<any>({ url: '/api/admin/announcement', data, showSuccessMessage: true })
}

/** 编辑公告 */
export function updateAnnouncement(id: number, data: any) {
  return request.put<any>({ url: `/api/admin/announcement/${id}`, data, showSuccessMessage: true })
}

/** 删除公告 */
export function deleteAnnouncement(id: number) {
  return request.del<any>({ url: `/api/admin/announcement/${id}`, showSuccessMessage: true })
}
