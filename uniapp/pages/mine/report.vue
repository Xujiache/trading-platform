<template>
  <view class="report-page">
    <NavBar title="交易报表" :show-back="true" />
    <view class="tab-bar">
      <text class="tab" :class="{ active: activeTab === 'trade' }" @click="activeTab = 'trade'">交易报表</text>
      <text class="tab" :class="{ active: activeTab === 'pnl' }" @click="activeTab = 'pnl'">盈亏报表</text>
      <text class="tab" :class="{ active: activeTab === 'fee' }" @click="activeTab = 'fee'">费用报表</text>
    </view>

    <view v-if="activeTab === 'trade'" class="section">
      <view class="stats-grid">
        <view class="stat-card"><text class="stat-value">{{ tradeData.totalTrades }}</text><text class="stat-label">总交易数</text></view>
        <view class="stat-card"><text class="stat-value up">{{ tradeData.winTrades }}</text><text class="stat-label">盈利笔数</text></view>
        <view class="stat-card"><text class="stat-value down">{{ tradeData.lossTrades }}</text><text class="stat-label">亏损笔数</text></view>
        <view class="stat-card"><text class="stat-value">{{ tradeData.winRate }}%</text><text class="stat-label">胜率</text></view>
      </view>
      <view class="summary-card">
        <view class="summary-row"><text class="label">总盈亏</text><text class="value" :class="parseFloat(tradeData.totalPnl) >= 0 ? 'up' : 'down'">¥{{ tradeData.totalPnl }}</text></view>
        <view class="summary-row"><text class="label">总手数</text><text class="value">{{ tradeData.totalLots }}</text></view>
      </view>
    </view>

    <view v-if="activeTab === 'pnl'" class="section">
      <view class="summary-card">
        <view class="summary-row"><text class="label">总盈亏</text><text class="value">¥{{ pnlData.totalPnl }}</text></view>
        <view class="summary-row"><text class="label">总手续费</text><text class="value">¥{{ pnlData.totalCommission }}</text></view>
        <view class="summary-row"><text class="label">总隔夜费</text><text class="value">¥{{ pnlData.totalSwap }}</text></view>
        <view class="summary-row total"><text class="label">净利润</text><text class="value" :class="parseFloat(pnlData.netProfit) >= 0 ? 'up' : 'down'">¥{{ pnlData.netProfit }}</text></view>
      </view>
    </view>

    <view v-if="activeTab === 'fee'" class="section">
      <view class="summary-card">
        <view class="summary-row"><text class="label">总手续费</text><text class="value">¥{{ feeData.totalCommission }}</text></view>
        <view class="summary-row"><text class="label">总隔夜费</text><text class="value">¥{{ feeData.totalSwap }}</text></view>
        <view class="summary-row total"><text class="label">费用合计</text><text class="value">¥{{ feeData.totalFees }}</text></view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import NavBar from '../../components/NavBar.vue';
import { get } from '../../utils/request';

const activeTab = ref('trade');
const tradeData = ref({ totalTrades: 0, winTrades: 0, lossTrades: 0, winRate: '0', totalPnl: '0', totalLots: '0' });
const pnlData = ref({ totalPnl: '0', totalCommission: '0', totalSwap: '0', netProfit: '0' });
const feeData = ref({ totalCommission: '0', totalSwap: '0', totalFees: '0' });

async function fetchData() {
  try {
    if (activeTab.value === 'trade') tradeData.value = await get('/api/mobile/report/trade');
    if (activeTab.value === 'pnl') pnlData.value = await get('/api/mobile/report/pnl');
    if (activeTab.value === 'fee') feeData.value = await get('/api/mobile/report/fee');
  } catch { /* handled */ }
}

watch(activeTab, () => fetchData());
onMounted(() => fetchData());
</script>

<style scoped>
.report-page { min-height: 100vh; background: #f0f4f8; }
.tab-bar { display: flex; background: #fff; }
.tab { flex: 1; text-align: center; padding: 12px; font-size: 14px; color: #999; }
.tab.active { color: #2563eb; font-weight: 600; border-bottom: 2px solid #2563eb; }
.section { padding: 16px; }
.stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 16px; }
.stat-card { background: #fff; border-radius: 8px; padding: 16px; text-align: center; }
.stat-value { font-size: 24px; font-weight: bold; color: #1a1a1a; display: block; }
.stat-label { font-size: 12px; color: #999; margin-top: 4px; display: block; }
.up { color: #10b981; }
.down { color: #ef4444; }
.summary-card { background: #fff; border-radius: 8px; padding: 16px; }
.summary-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
.summary-row:last-child { border-bottom: none; }
.summary-row.total { font-weight: 600; border-top: 1px solid #e5e7eb; margin-top: 4px; padding-top: 12px; }
.label { font-size: 14px; color: #666; }
.value { font-size: 14px; font-weight: 500; color: #1a1a1a; }
</style>
