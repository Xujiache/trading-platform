<template>
  <view class="market-page">
    <view class="market-header">
      <text class="header-title">行情中心</text>
    </view>

    <view class="symbol-list">
      <view v-for="item in symbols" :key="item.symbol" class="symbol-card" @click="goDetail(item)">
        <view class="symbol-left">
          <text class="symbol-name">{{ item.name }}</text>
          <text class="symbol-code">{{ item.symbol }}</text>
        </view>
        <view class="symbol-center">
          <text class="symbol-price" :class="priceClass(item)">{{ item.price?.last || '--' }}</text>
        </view>
        <view class="symbol-right">
          <view class="change-badge" :class="changeClass(item)">
            <text class="change-text">{{ formatChange(item) }}</text>
          </view>
        </view>
      </view>
    </view>

    <Loading v-if="loading" text="加载行情数据..." />
  </view>
</template>

<script setup lang="ts">
/**
 * 行情列表页（TabBar 页面）
 * 实时展示品种行情，定期轮询更新
 */
import { ref, onMounted, onUnmounted } from 'vue';
import Loading from '../../components/Loading.vue';
import { get } from '../../utils/request';

interface SymbolItem {
  id: number;
  symbol: string;
  name: string;
  price: { last: string; change: string; changePercent: string; bid: string; ask: string } | null;
}

const symbols = ref<SymbolItem[]>([]);
const loading = ref(true);
let pollTimer: ReturnType<typeof setInterval> | null = null;

async function fetchSymbols() {
  try {
    symbols.value = await get<SymbolItem[]>('/api/mobile/market/symbols');
  } catch { /* handled */ } finally {
    loading.value = false;
  }
}

function priceClass(item: SymbolItem) {
  if (!item.price) return '';
  return parseFloat(item.price.change) >= 0 ? 'price-up' : 'price-down';
}

function changeClass(item: SymbolItem) {
  if (!item.price) return '';
  return parseFloat(item.price.change) >= 0 ? 'badge-up' : 'badge-down';
}

function formatChange(item: SymbolItem) {
  if (!item.price) return '--';
  const pct = item.price.changePercent;
  const prefix = parseFloat(pct) >= 0 ? '+' : '';
  return `${prefix}${pct}%`;
}

function goDetail(item: SymbolItem) {
  uni.navigateTo({ url: `/pages/market/detail?id=${item.id}` });
}

onMounted(() => {
  fetchSymbols();
  pollTimer = setInterval(fetchSymbols, 3000);
});

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer);
});
</script>

<style scoped>
.market-page { min-height: 100vh; background: #f0f4f8; }
.market-header { padding: 60px 24px 20px; background: #fff; }
.header-title { font-size: 20px; font-weight: bold; color: #1a1a1a; }
.symbol-list { padding: 12px 16px; }
.symbol-card { display: flex; align-items: center; background: #fff; border-radius: 12px; padding: 16px 20px; margin-bottom: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
.symbol-left { flex: 1; }
.symbol-name { font-size: 16px; font-weight: 600; color: #1a1a1a; display: block; }
.symbol-code { font-size: 12px; color: #999; margin-top: 4px; display: block; }
.symbol-center { flex: 1; text-align: center; }
.symbol-price { font-size: 20px; font-weight: bold; font-family: 'SF Mono', monospace; }
.price-up { color: #10b981; }
.price-down { color: #ef4444; }
.symbol-right { flex: 0 0 80px; text-align: right; }
.change-badge { padding: 6px 12px; border-radius: 6px; display: inline-block; }
.badge-up { background: rgba(16,185,129,0.1); }
.badge-down { background: rgba(239,68,68,0.1); }
.change-text { font-size: 14px; font-weight: 600; font-family: 'SF Mono', monospace; }
.badge-up .change-text { color: #10b981; }
.badge-down .change-text { color: #ef4444; }
</style>
