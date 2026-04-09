import request from '../utils/request';

/**
 * 获取订单列表（管理端）
 */
export function getOrderList(params: Record<string, unknown>) {
  return request.get('/trade/orders', { params });
}

/**
 * 获取持仓列表（管理端）
 */
export function getPositionList(params?: Record<string, unknown>) {
  return request.get('/trade/positions', { params });
}

/**
 * 手动平仓
 */
export function forceCloseOrder(id: number) {
  return request.post(`/trade/force-close/${id}`);
}

/**
 * 获取订单详情
 */
export function getOrderDetail(id: number) {
  return request.get(`/trade/orders/${id}`);
}

/**
 * 撤销订单
 */
export function cancelOrder(id: number) {
  return request.post(`/trade/cancel/${id}`);
}

/**
 * 订单改价
 */
export function updateOrderPrice(id: number, data: { openPrice: number }) {
  return request.put(`/trade/orders/${id}/price`, data);
}

/**
 * 获取交易统计
 */
export function getTradeStatistics() {
  return request.get('/trade/statistics');
}
