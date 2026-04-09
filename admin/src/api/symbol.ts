import request from '../utils/request';

/**
 * 获取品种列表（管理端）
 */
export function getSymbolList() {
  return request.get('/symbol');
}

/**
 * 更新品种
 */
export function updateSymbol(id: number, data: Record<string, unknown>) {
  return request.put(`/symbol/${id}`, data);
}

/**
 * 启用/禁用品种
 */
export function updateSymbolStatus(id: number, status: number) {
  return request.put(`/symbol/${id}/status`, { status });
}
