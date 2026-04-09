import { defineStore } from 'pinia';
import { ref } from 'vue';
import { get, post, del } from '../utils/request';

interface AssetOverview {
  balance: string;
  frozenBalance: string;
  usedMargin: string;
  floatingPnl: string;
  equity: string;
  totalDeposit: string;
  totalWithdraw: string;
  totalPnl: string;
}

interface BankCard {
  id: number;
  cardNumber: string;
  bankName: string;
  holderName: string;
  isDefault: boolean;
}

/**
 * 资产状态管理
 * 管理资产总览、银行卡等
 */
export const useAssetStore = defineStore('asset', () => {
  const overview = ref<AssetOverview | null>(null);
  const bankCards = ref<BankCard[]>([]);
  const loading = ref(false);

  /**
   * 获取资产总览
   */
  async function fetchOverview() {
    overview.value = await get<AssetOverview>('/api/mobile/fund/overview');
  }

  /**
   * 获取银行卡列表
   */
  async function fetchBankCards() {
    bankCards.value = await get<BankCard[]>('/api/mobile/fund/bank-cards');
  }

  /**
   * 添加银行卡
   */
  async function addBankCard(data: Record<string, unknown>) {
    return post('/api/mobile/fund/bank-cards', data);
  }

  /**
   * 删除银行卡
   */
  async function removeBankCard(id: number) {
    return del(`/api/mobile/fund/bank-cards/${id}`);
  }

  /**
   * 申请入金
   */
  async function deposit(data: Record<string, unknown>) {
    return post('/api/mobile/fund/deposit', data);
  }

  /**
   * 申请出金
   */
  async function withdraw(data: Record<string, unknown>) {
    return post('/api/mobile/fund/withdraw', data);
  }

  return { overview, bankCards, loading, fetchOverview, fetchBankCards, addBankCard, removeBankCard, deposit, withdraw };
});
