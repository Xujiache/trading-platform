import request from '@/utils/http'

export interface TradeOrder {
  id: number
  order_no: string
  user_id: number
  account_type: 'real' | 'demo'
  symbol: string
  symbol_name?: string
  direction: 'buy' | 'sell'
  lots: number
  leverage: number
  open_price: number
  close_price: number | null
  stop_loss: number | null
  take_profit: number | null
  trailing_stop: number | null
  margin: number
  commission: number
  commission_close: number
  swap_total: number
  spread_cost: number
  floating_pnl: number
  realized_pnl: number | null
  net_pnl: number | null
  status: 'open' | 'closed' | 'cancelled'
  close_type: string | null
  opened_at: string
  closed_at: string | null
  user_email?: string
  user_nickname?: string
  currentPrice?: number
}

export interface OrderSearchParams {
  page?: number
  pageSize?: number
  userId?: number
  symbol?: string
  status?: string
  direction?: string
  accountType?: string
  startDate?: string
  endDate?: string
}

export interface FlowSearchParams {
  page?: number
  pageSize?: number
  userId?: number
  flowType?: string
  accountType?: string
  startDate?: string
  endDate?: string
}

export function fetchTradeOrders(params: OrderSearchParams) {
  return request.get<any>({
    url: '/api/admin/trade/orders',
    params
  })
}

export function fetchTradeOrderDetail(id: number) {
  return request.get<TradeOrder>({
    url: `/api/admin/trade/orders/${id}`
  })
}

export function fetchPositions(params: OrderSearchParams) {
  return request.get<any>({
    url: '/api/admin/trade/positions',
    params
  })
}

export function adminCloseOrder(id: number) {
  return request.post<any>({
    url: `/api/admin/trade/orders/${id}/close`,
    showSuccessMessage: true
  })
}

export function adminCancelOrder(id: number) {
  return request.post<any>({
    url: `/api/admin/trade/orders/${id}/cancel`,
    showSuccessMessage: true
  })
}

export function adminModifyPrice(id: number, newPrice: number) {
  return request.put<any>({
    url: `/api/admin/trade/orders/${id}/price`,
    data: { newPrice },
    showSuccessMessage: true
  })
}

export function fetchTradeFlows(params: FlowSearchParams) {
  return request.get<any>({
    url: '/api/admin/trade/flows',
    params
  })
}

export function fetchTradeStatistics(params?: { startDate?: string; endDate?: string; accountType?: string }) {
  return request.get<any>({
    url: '/api/admin/trade/statistics',
    params
  })
}

export function fetchPendingOrders(params: OrderSearchParams) {
  return request.get<any>({
    url: '/api/admin/trade/pendings',
    params
  })
}

export function adminCancelPending(id: number) {
  return request.post<any>({
    url: `/api/admin/trade/orders/${id}/cancel`,
    showSuccessMessage: true
  })
}
