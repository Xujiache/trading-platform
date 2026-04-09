<template>
  <view class="trade-page">
    <view class="trade-header">
      <text class="header-title">交易</text>
    </view>

    <view class="account-bar">
      <view class="account-item"><text class="item-label">余额</text><text class="item-value">¥{{ account.balance }}</text></view>
      <view class="account-item"><text class="item-label">净值</text><text class="item-value">¥{{ account.equity }}</text></view>
      <view class="account-item"><text class="item-label">浮盈</text><text class="item-value" :class="parseFloat(account.floatingPnl) >= 0 ? 'up' : 'down'">¥{{ account.floatingPnl }}</text></view>
    </view>

    <view class="tab-bar">
      <text class="tab" :class="{ active: activeTab === 'positions' }" @click="activeTab = 'positions'">持仓</text>
      <text class="tab" :class="{ active: activeTab === 'pending' }" @click="activeTab = 'pending'">挂单</text>
      <text class="tab" :class="{ active: activeTab === 'history' }" @click="activeTab = 'history'">历史</text>
    </view>

    <view v-if="activeTab === 'positions'">
      <view v-if="positions.length" class="position-list">
        <view v-for="item in positions" :key="item.id" class="position-card">
          <view class="pos-header">
            <text class="pos-symbol">{{ item.symbol?.name }} {{ item.direction === 'buy' ? '多' : '空' }}</text>
            <text class="pos-pnl" :class="parseFloat(item.floatingPnl) >= 0 ? 'up' : 'down'">{{ item.floatingPnl }}</text>
          </view>
          <view class="pos-info">
            <text class="pos-detail">{{ item.lots }}手 | 开仓{{ item.openPrice }}</text>
            <button class="close-btn" @click="handleClose(item.id)">平仓</button>
          </view>
        </view>
      </view>
      <Empty v-else text="暂无持仓" />
    </view>

    <view v-if="activeTab === 'pending'">
      <Empty text="暂无挂单" />
    </view>

    <view v-if="activeTab === 'history'">
      <Empty text="暂无历史订单" />
    </view>
  </view>
</template>

<script setup lang="ts">
/**
 * 交易/持仓页（TabBar 页面）
 * 展示账户信息、持仓列表，支持平仓操作
 */
import { ref, onMounted, onUnmounted } from 'vue';
import Empty from '../../components/Empty.vue';
import { get, post } from '../../utils/request';

const activeTab = ref('positions');
const positions = ref<Record<string, unknown>[]>([]);
const account = ref({ balance: '0.00', equity: '0.00', floatingPnl: '0.00' });
let pollTimer: ReturnType<typeof setInterval> | null = null;

async function fetchData() {
  try {
    const [pos, acc] = await Promise.all([
      get<Record<string, unknown>[]>('/api/mobile/trade/positions'),
      get<Record<string, string>>('/api/mobile/trade/account'),
    ]);
    positions.value = pos;
    account.value = acc;
  } catch { /* handled */ }
}

async function handleClose(orderId: number) {
  uni.showModal({
    title: '确认平仓',
    content: '确定要平仓该订单吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await post(`/api/mobile/trade/close/${orderId}`, {});
          uni.showToast({ title: '平仓成功', icon: 'success' });
          fetchData();
        } catch { /* handled */ }
      }
    },
  });
}

onMounted(() => { fetchData(); pollTimer = setInterval(fetchData, 3000); });
onUnmounted(() => { if (pollTimer) clearInterval(pollTimer); });
</script>

<style scoped>
.trade-page { min-height: 100vh; background: #f0f4f8; }
.trade-header { padding: 60px 24px 16px; background: #fff; }
.header-title { font-size: 20px; font-weight: bold; color: #1a1a1a; }
.account-bar { display: flex; background: #fff; padding: 12px 16px; border-top: 1px solid #f3f4f6; }
.account-item { flex: 1; text-align: center; }
.item-label { font-size: 12px; color: #999; display: block; }
.item-value { font-size: 16px; font-weight: 600; color: #1a1a1a; display: block; margin-top: 4px; }
.up { color: #10b981; }
.down { color: #ef4444; }
.tab-bar { display: flex; background: #fff; border-top: 1px solid #f3f4f6; }
.tab { flex: 1; text-align: center; padding: 12px; font-size: 14px; color: #999; }
.tab.active { color: #2563eb; font-weight: 600; border-bottom: 2px solid #2563eb; }
.position-list { padding: 12px 16px; }
.position-card { background: #fff; border-radius: 8px; padding: 14px 16px; margin-bottom: 8px; }
.pos-header { display: flex; justify-content: space-between; align-items: center; }
.pos-symbol { font-size: 15px; font-weight: 600; color: #1a1a1a; }
.pos-pnl { font-size: 16px; font-weight: bold; font-family: 'SF Mono', monospace; }
.pos-info { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; }
.pos-detail { font-size: 13px; color: #666; }
.close-btn { padding: 4px 16px; font-size: 13px; background: #ef4444; color: #fff; border-radius: 4px; border: none; }
</style>
