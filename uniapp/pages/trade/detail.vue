<template>
  <view class="detail-page">
    <NavBar title="订单详情" :show-back="true" />
    <view v-if="order" class="detail-content">
      <view class="status-header" :class="order.status">
        <text class="status-text">{{ statusText }}</text>
      </view>
      <view class="info-card">
        <view class="info-row"><text class="label">订单号</text><text class="value">{{ order.orderNo }}</text></view>
        <view class="info-row"><text class="label">品种</text><text class="value">{{ order.symbol?.name }}</text></view>
        <view class="info-row"><text class="label">方向</text><text class="value" :class="order.direction === 'buy' ? 'up' : 'down'">{{ order.direction === 'buy' ? '买涨' : '买跌' }}</text></view>
        <view class="info-row"><text class="label">手数</text><text class="value">{{ order.lots }}</text></view>
        <view class="info-row"><text class="label">杠杆</text><text class="value">1:{{ order.leverage }}</text></view>
        <view class="info-row"><text class="label">开仓价</text><text class="value">{{ order.openPrice }}</text></view>
        <view class="info-row" v-if="order.closePrice"><text class="label">平仓价</text><text class="value">{{ order.closePrice }}</text></view>
        <view class="info-row"><text class="label">保证金</text><text class="value">¥{{ order.margin }}</text></view>
        <view class="info-row"><text class="label">手续费</text><text class="value">¥{{ order.commission }}</text></view>
        <view class="info-row" v-if="order.closedPnl"><text class="label">盈亏</text><text class="value" :class="parseFloat(order.closedPnl) >= 0 ? 'up' : 'down'">¥{{ order.closedPnl }}</text></view>
        <view class="info-row"><text class="label">开仓时间</text><text class="value">{{ order.openedAt }}</text></view>
        <view class="info-row" v-if="order.closedAt"><text class="label">平仓时间</text><text class="value">{{ order.closedAt }}</text></view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
/**
 * 订单详情页面
 */
import { ref, computed, onMounted } from 'vue';
import NavBar from '../../components/NavBar.vue';
import { get } from '../../utils/request';

const order = ref<Record<string, unknown> | null>(null);

const statusText = computed(() => {
  const map: Record<string, string> = { open: '持仓中', closed: '已平仓', cancelled: '已取消' };
  return map[order.value?.status as string] || '--';
});

onMounted(async () => {
  const pages = getCurrentPages();
  const page = pages[pages.length - 1] as unknown as { options: Record<string, string> };
  const id = page.options?.id;
  if (!id) return;
  try { order.value = await get(`/api/mobile/trade/orders/${id}`); } catch { /* handled */ }
});
</script>

<style scoped>
.detail-page { min-height: 100vh; background: #f0f4f8; }
.status-header { padding: 20px 24px; text-align: center; }
.status-header.open { background: #10b981; }
.status-header.closed { background: #6b7280; }
.status-text { font-size: 18px; font-weight: 600; color: #fff; }
.info-card { margin: 16px; background: #fff; border-radius: 12px; padding: 16px 20px; }
.info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
.info-row:last-child { border-bottom: none; }
.label { font-size: 14px; color: #666; }
.value { font-size: 14px; color: #1a1a1a; font-weight: 500; }
.up { color: #10b981; }
.down { color: #ef4444; }
</style>
