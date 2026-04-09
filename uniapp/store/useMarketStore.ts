import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { get } from '../utils/request';

interface TickData {
  symbol: string;
  bid: string;
  ask: string;
  high: string;
  low: string;
  open: string;
  last: string;
  change: string;
  changePercent: string;
  volume: string;
  timestamp: number;
}

interface SymbolInfo {
  id: number;
  symbol: string;
  name: string;
  category: string;
  contractUnit: number;
  minLots: string;
  maxLots: string;
  leverageMax: number;
  pricePrecision: number;
  status: number;
}

/**
 * 行情状态管理
 * 存储实时行情数据和品种信息
 */
export const useMarketStore = defineStore('market', () => {
  const prices = ref<Map<string, TickData>>(new Map());
  const symbols = ref<SymbolInfo[]>([]);
  const loading = ref(false);

  /**
   * 获取品种列表
   */
  async function fetchSymbols() {
    loading.value = true;
    try {
      symbols.value = await get<SymbolInfo[]>('/api/mobile/market/symbols');
    } finally {
      loading.value = false;
    }
  }

  /**
   * 更新实时行情
   * @param tick - 行情数据
   */
  function updatePrice(tick: TickData) {
    prices.value.set(tick.symbol, tick);
  }

  /**
   * 批量更新行情
   * @param ticks - 行情数据数组
   */
  function updatePrices(ticks: TickData[]) {
    ticks.forEach((tick) => prices.value.set(tick.symbol, tick));
  }

  /**
   * 获取指定品种当前价格
   * @param symbol - 品种代码
   */
  function getPrice(symbol: string): TickData | undefined {
    return prices.value.get(symbol);
  }

  return { prices, symbols, loading, fetchSymbols, updatePrice, updatePrices, getPrice };
});
