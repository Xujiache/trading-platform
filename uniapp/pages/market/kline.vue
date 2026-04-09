<template>
  <view class="kline-page">
    <NavBar :title="symbolName" :show-back="true" />
    <view class="kline-content">
      <view class="period-tabs">
        <text v-for="p in periods" :key="p" class="period-tab" :class="{ active: currentPeriod === p }" @click="currentPeriod = p">{{ p }}</text>
      </view>
      <view class="chart-placeholder">
        <text class="placeholder-text">K 线图表区域</text>
        <text class="placeholder-sub">（集成 ECharts 后展示蜡烛图）</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
/**
 * K 线图页面
 * 多周期切换，后续集成 ECharts 蜡烛图
 */
import { ref, onMounted } from 'vue';
import NavBar from '../../components/NavBar.vue';

const symbolName = ref('K 线图');
const currentPeriod = ref('1m');
const periods = ['1m', '5m', '15m', '30m', '1h', '4h', '1d'];

onMounted(() => {
  const pages = getCurrentPages();
  const page = pages[pages.length - 1] as unknown as { options: Record<string, string> };
  symbolName.value = page.options?.name || 'K 线图';
});
</script>

<style scoped>
.kline-page { min-height: 100vh; background: #1a1a2e; }
.period-tabs { display: flex; padding: 12px 16px; gap: 8px; }
.period-tab { padding: 6px 12px; border-radius: 4px; font-size: 13px; color: #999; background: #2a2a3e; }
.period-tab.active { color: #fff; background: #2563eb; }
.chart-placeholder { height: 400px; margin: 16px; background: #2a2a3e; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.placeholder-text { color: #666; font-size: 16px; }
.placeholder-sub { color: #555; font-size: 12px; margin-top: 8px; }
</style>
