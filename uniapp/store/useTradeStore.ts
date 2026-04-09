import { defineStore } from 'pinia';
import { ref } from 'vue';
import { get, post, put, del } from '../utils/request';

interface Position {
  id: number;
  orderNo: string;
  symbolId: number;
  direction: string;
  lots: string;
  leverage: number;
  openPrice: string;
  stopLoss: string | null;
  takeProfit: string | null;
  margin: string;
  floatingPnl: string;
  commission: string;
  swap: string;
  openedAt: string;
  symbol: { symbol: string; name: string; pricePrecision: number };
}

interface AccountInfo {
  balance: string;
  frozenBalance: string;
  usedMargin: string;
  floatingPnl: string;
  totalDeposit: string;
  totalWithdraw: string;
}

/**
 * 交易状态管理
 * 管理持仓、订单、账户信息
 */
export const useTradeStore = defineStore('trade', () => {
  const positions = ref<Position[]>([]);
  const accountInfo = ref<AccountInfo | null>(null);
  const loading = ref(false);

  /**
   * 获取持仓列表
   */
  async function fetchPositions() {
    positions.value = await get<Position[]>('/api/mobile/trade/positions');
  }

  /**
   * 获取账户信息
   */
  async function fetchAccount() {
    accountInfo.value = await get<AccountInfo>('/api/mobile/trade/account');
  }

  /**
   * 下单
   */
  async function placeOrder(data: Record<string, unknown>) {
    return post('/api/mobile/trade/order', data);
  }

  /**
   * 平仓
   */
  async function closePosition(id: number) {
    return post(`/api/mobile/trade/close/${id}`);
  }

  /**
   * 一键全平
   */
  async function closeAll() {
    return post('/api/mobile/trade/close-all');
  }

  /**
   * 修改止损止盈
   */
  async function modifyOrder(id: number, data: { stopLoss?: number; takeProfit?: number }) {
    return put(`/api/mobile/trade/order/${id}`, data);
  }

  return { positions, accountInfo, loading, fetchPositions, fetchAccount, placeOrder, closePosition, closeAll, modifyOrder };
});
