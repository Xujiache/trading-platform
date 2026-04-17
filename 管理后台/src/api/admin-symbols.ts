import request from '@/utils/http'

export type PriceSource = 'real' | 'custom' | 'hybrid'
export type TrendDirection = 'up' | 'down' | 'sideways'
export type VolatilityLevel = 'low' | 'medium' | 'high' | 'custom'

export interface TradingSymbol {
  id: number
  symbol: string
  name: string
  category: 'precious_metal' | 'energy' | 'forex'
  status: 'active' | 'inactive'
  price_source: PriceSource
  is_hot: boolean
  contract_unit: string
  min_lot: number
  max_lot: number
  lot_step: number
  min_leverage: number
  max_leverage: number
  price_decimals: number
  tick_value: number
  tick_size: number
  spread_mode: 'fixed' | 'float'
  spread_fixed: number
  spread_min: number
  spread_max: number
  fee_mode: 'one_side' | 'both_side'
  fee_type: 'per_lot' | 'percentage'
  fee_value: number
  swap_long_rate: number
  swap_short_rate: number
  swap_wednesday_multiplier: number
  swap_holiday_multiplier: number
  max_position: number
  max_slippage: number
  trading_hours: any
  sort_order: number
  description: string
  created_at: string
  updated_at: string
}

export interface SymbolSearchParams {
  page?: number
  pageSize?: number
  category?: string
  status?: string
  price_source?: PriceSource
  keyword?: string
  sort_by?: string
  sort_order?: string
}

export interface SimConfig {
  center_price: number
  lower_bound: number
  upper_bound: number
  trend_direction: TrendDirection
  trend_strength: number
  volatility_level: VolatilityLevel
  volatility_sigma: number | null
  mean_reversion_kappa: number | null
  tick_interval_ms: number
  max_tick_change_pct: number
  hybrid_bias: number
  last_price: number | null
  enabled: number
  updated_at?: string
}

export interface SimRuntime {
  symbolId: number
  symbol: string
  centerPrice: number
  lowerBound: number
  upperBound: number
  trendDirection: TrendDirection
  trendStrength: number
  volatilityLevel: VolatilityLevel
  tickIntervalMs: number
  currentBid: number | null
  currentAsk: number | null
  edgeDistancePct: number | null
  tickCount: number
  errorCount: number
  lastTickAt: number | null
  startedAt: number
}

export interface SimConfigDetail {
  symbol_id: number
  symbol: string
  name: string
  price_source: PriceSource
  config: SimConfig | null
  runtime: SimRuntime | null
}

export function fetchSymbolList(params: SymbolSearchParams) {
  return request.get<any>({
    url: '/api/admin/symbols',
    params
  })
}

export function fetchSymbolDetail(id: number) {
  return request.get<TradingSymbol>({
    url: `/api/admin/symbols/${id}`
  })
}

export function createSymbol(data: Partial<TradingSymbol>) {
  return request.post<TradingSymbol>({
    url: '/api/admin/symbols',
    data,
    showSuccessMessage: true
  })
}

export function updateSymbol(id: number, data: Partial<TradingSymbol>) {
  return request.put<TradingSymbol>({
    url: `/api/admin/symbols/${id}`,
    data,
    showSuccessMessage: true
  })
}

export function updateSymbolStatus(id: number, status: 'active' | 'inactive') {
  return request.put<TradingSymbol>({
    url: `/api/admin/symbols/${id}/status`,
    data: { status },
    showSuccessMessage: true
  })
}

export function deleteSymbol(id: number) {
  return request.del<any>({
    url: `/api/admin/symbols/${id}`,
    showSuccessMessage: true
  })
}

// ==================== 模拟引擎 API ====================

export function fetchSimConfig(id: number) {
  return request.get<SimConfigDetail>({
    url: `/api/admin/symbols/${id}/sim-config`
  })
}

export function saveSimConfig(id: number, data: Partial<SimConfig>) {
  return request.put<any>({
    url: `/api/admin/symbols/${id}/sim-config`,
    data,
    showSuccessMessage: true
  })
}

export function updatePriceSource(id: number, priceSource: PriceSource) {
  return request.put<any>({
    url: `/api/admin/symbols/${id}/price-source`,
    data: { price_source: priceSource },
    showSuccessMessage: true
  })
}

export function resetSimCenter(id: number) {
  return request.post<any>({
    url: `/api/admin/symbols/${id}/sim-reset-center`,
    showSuccessMessage: true
  })
}

export function nudgeSimPrice(id: number, payload: { delta?: number; price?: number }) {
  return request.post<any>({
    url: `/api/admin/symbols/${id}/sim-nudge`,
    data: payload,
    showSuccessMessage: true
  })
}

export function rebuildSimKline(id: number) {
  return request.post<any>({
    url: `/api/admin/symbols/${id}/sim-rebuild-kline`,
    showSuccessMessage: true
  })
}

export function fetchSimStatus() {
  return request.get<{ list: SimRuntime[]; total: number }>({
    url: '/api/admin/symbols/sim/status'
  })
}
