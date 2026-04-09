<template>
  <view class="detail-page">
    <NavBar :title="symbol?.name || '品种详情'" :show-back="true" />

    <view v-if="symbol" class="detail-content">
      <view class="price-section">
        <text class="current-price" :class="priceClass">{{ symbol.price?.last || '--' }}</text>
        <view class="price-info">
          <text class="change-text" :class="priceClass">{{ formatChange }}</text>
          <text class="time-text">实时行情</text>
        </view>
      </view>

      <view class="bid-ask-row">
        <view class="bid-box">
          <text class="label">买入价</text>
          <text class="bid-price">{{ symbol.price?.ask || '--' }}</text>
        </view>
        <view class="ask-box">
          <text class="label">卖出价</text>
          <text class="ask-price">{{ symbol.price?.bid || '--' }}</text>
        </view>
      </view>

      <view class="info-card">
        <text class="card-title">合约规格</text>
        <view class="info-row"><text class="info-label">品种代码</text><text class="info-value">{{ symbol.symbol }}</text></view>
        <view class="info-row"><text class="info-label">合约单位</text><text class="info-value">{{ symbol.contractUnitDesc }}</text></view>
        <view class="info-row"><text class="info-label">杠杆范围</text><text class="info-value">1:{{ symbol.leverageMin }} ~ 1:{{ symbol.leverageMax }}</text></view>
        <view class="info-row"><text class="info-label">点差</text><text class="info-value">{{ symbol.spreadValue }}</text></view>
        <view class="info-row"><text class="info-label">手续费</text><text class="info-value">{{ symbol.commissionValue }}/手</text></view>
        <view class="info-row"><text class="info-label">最小手数</text><text class="info-value">{{ symbol.minLots }}</text></view>
      </view>

      <view class="action-row">
        <button class="buy-btn" @click="goTrade('buy')">买涨</button>
        <button class="sell-btn" @click="goTrade('sell')">买跌</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
/**
 * 品种详情页
 * 展示实时行情、合约规格、快速下单入口
 */
import { ref, computed, onMounted, onUnmounted } from 'vue';
import NavBar from '../../components/NavBar.vue';
import { get } from '../../utils/request';

const symbol = ref<Record<string, unknown> | null>(null);
let pollTimer: ReturnType<typeof setInterval> | null = null;

const priceClass = computed(() => {
  if (!symbol.value?.price) return '';
  const p = symbol.value.price as Record<string, string>;
  return parseFloat(p.change) >= 0 ? 'up' : 'down';
});

const formatChange = computed(() => {
  if (!symbol.value?.price) return '--';
  const p = symbol.value.price as Record<string, string>;
  const prefix = parseFloat(p.changePercent) >= 0 ? '+' : '';
  return `${prefix}${p.change} (${prefix}${p.changePercent}%)`;
});

async function fetchDetail() {
  const pages = getCurrentPages();
  const page = pages[pages.length - 1] as unknown as { options: Record<string, string> };
  const id = page.options?.id;
  if (!id) return;
  try {
    symbol.value = await get<Record<string, unknown>>(`/api/mobile/market/symbols/${id}`);
  } catch { /* handled */ }
}

function goTrade(direction: string) {
  uni.navigateTo({ url: `/pages/trade/order?symbolId=${symbol.value?.id}&direction=${direction}` });
}

onMounted(() => { fetchDetail(); pollTimer = setInterval(fetchDetail, 3000); });
onUnmounted(() => { if (pollTimer) clearInterval(pollTimer); });
</script>

<style scoped>
.detail-page { min-height: 100vh; background: #f0f4f8; }
.price-section { padding: 20px 24px; background: #fff; }
.current-price { font-size: 36px; font-weight: bold; font-family: 'SF Mono', monospace; }
.up { color: #10b981; }
.down { color: #ef4444; }
.price-info { margin-top: 4px; }
.change-text { font-size: 14px; font-family: 'SF Mono', monospace; }
.time-text { font-size: 12px; color: #999; margin-left: 12px; }
.bid-ask-row { display: flex; gap: 12px; padding: 12px 16px; }
.bid-box, .ask-box { flex: 1; background: #fff; border-radius: 8px; padding: 12px; text-align: center; }
.label { font-size: 12px; color: #999; display: block; margin-bottom: 4px; }
.bid-price { font-size: 18px; font-weight: bold; color: #10b981; }
.ask-price { font-size: 18px; font-weight: bold; color: #ef4444; }
.info-card { margin: 12px 16px; background: #fff; border-radius: 12px; padding: 16px 20px; }
.card-title { font-size: 16px; font-weight: 600; color: #1a1a1a; margin-bottom: 12px; display: block; }
.info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
.info-row:last-child { border-bottom: none; }
.info-label { font-size: 14px; color: #666; }
.info-value { font-size: 14px; color: #1a1a1a; font-weight: 500; }
.action-row { display: flex; gap: 12px; padding: 20px 16px; }
.buy-btn, .sell-btn { flex: 1; height: 48px; border-radius: 8px; font-size: 16px; font-weight: 600; border: none; color: #fff; }
.buy-btn { background: #10b981; }
.sell-btn { background: #ef4444; }
</style>
