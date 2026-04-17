import request from '@/utils/http'

export interface ConfigItem {
  id: number
  config_key: string
  config_value: string
  config_type: string
  category: string
  label: string
  description: string
  sort_order: number
}

export function fetchConfigList(params?: { category?: string; keyword?: string }) {
  return request.get<ConfigItem[]>({
    url: '/api/admin/config',
    params,
  })
}

export function fetchConfigCategories() {
  return request.get<string[]>({
    url: '/api/admin/config/categories',
  })
}

export function updateConfig(id: number, params: { config_value: string }) {
  return request.put({
    url: `/api/admin/config/${id}`,
    params,
  })
}

export function batchUpdateConfig(configs: { id: number; config_value: string }[]) {
  return request.put({
    url: '/api/admin/config/batch',
    params: { configs },
  })
}

export function fetchEmailConfig() {
  return request.get<Record<string, string>>({
    url: '/api/admin/config/email',
  })
}

export function updateEmailConfig(params: Record<string, string>) {
  return request.put({
    url: '/api/admin/config/email',
    params,
  })
}

export function testEmail(to: string) {
  return request.post({
    url: '/api/admin/config/email/test',
    params: { to },
  })
}

export function uploadImage(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return request.post<{ url: string; path: string; filename: string }>({
    url: '/api/admin/upload/image',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
