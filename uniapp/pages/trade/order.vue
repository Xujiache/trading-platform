<template>
  <view class="order-page">
    <NavBar title="下单" :show-back="true" />
    <view class="form-container">
      <view class="direction-tabs">
        <view class="tab buy-tab" :class="{ active: direction === 'buy' }" @click="direction = 'buy'">
          <text>买涨 (多)</text>
        </view>
        <view class="tab sell-tab" :class="{ active: direction === 'sell' }" @click="direction = 'sell'">
          <text>买跌 (空)</text>
        </view>
      </view>

      <view class="input-group">
        <text class="input-label">手数</text>
        <input v-model="lots" class="input-field" type="digit" placeholder="最小0.01手" />
      </view>

      <view class="input-group">
        <text class="input-label">杠杆</text>
        <view class="leverage-row">
          <text v-for="lev in leverages" :key="lev" class="leverage-btn" :class="{ active: leverage === lev }" @click="leverage = lev">1:{{ lev }}</text>
        </view>
      </view>

      <view class="input-group">
        <text class="input-label">止损 (选填)</text>
        <input v-model="stopLoss" class="input-field" type="digit" placeholder="止损价格" />
      </view>

      <view class="input-group">
        <text class="input-label">止盈 (选填)</text>
        <input v-model="takeProfit" class="input-field" type="digit" placeholder="止盈价格" />
      </view>

      <view v-if="estimation" class="estimate-card">
        <text class="estimate-title">费用预估</text>
        <view class="estimate-row"><text>保证金</text><text>¥{{ estimation.margin }}</text></view>
        <view class="estimate-row"><text>点差成本</text><text>¥{{ estimation.spreadCost }}</text></view>
        <view class="estimate-row"><text>手续费</text><text>¥{{ estimation.commission }}</text></view>
        <view class="estimate-row total"><text>合计</text><text>¥{{ estimation.total }}</text></view>
      </view>

      <button class="submit-btn" :class="direction === 'buy' ? 'btn-buy' : 'btn-sell'" :disabled="loading" @click="handleOrder">
        {{ loading ? '下单中...' : (direction === 'buy' ? '确认买涨' : '确认买跌') }}
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
/**
 * 下单页面
 * 支持方向选择、手数、杠杆、止损止盈、费用预估
 */
import { ref, watch, onMounted } from 'vue';
import NavBar from '../../components/NavBar.vue';
import { post } from '../../utils/request';

const direction = ref('buy');
const lots = ref('0.1');
const leverage = ref(100);
const stopLoss = ref('');
const takeProfit = ref('');
const loading = ref(false);
const symbolId = ref(1);
const estimation = ref<{ margin: string; spreadCost: string; commission: string; total: string } | null>(null);
const leverages = [10, 20, 50, 100, 200];

async function fetchEstimate() {
  if (!lots.value || parseFloat(lots.value) <= 0) return;
  try {
    estimation.value = await post('/api/mobile/trade/estimate', {
      symbolId: symbolId.value,
      lots: parseFloat(lots.value),
      leverage: leverage.value,
      direction: direction.value,
    });
  } catch { /* handled */ }
}

async function handleOrder() {
  if (!lots.value) { uni.showToast({ title: '请输入手数', icon: 'none' }); return; }
  loading.value = true;
  try {
    const body: Record<string, unknown> = {
      symbolId: symbolId.value,
      direction: direction.value,
      orderType: 'market',
      lots: parseFloat(lots.value),
      leverage: leverage.value,
    };
    if (stopLoss.value) body.stopLoss = parseFloat(stopLoss.value);
    if (takeProfit.value) body.takeProfit = parseFloat(takeProfit.value);
    await post('/api/mobile/trade/order', body);
    uni.showToast({ title: '下单成功', icon: 'success' });
    setTimeout(() => uni.navigateBack(), 1000);
  } catch (err: unknown) {
    uni.showToast({ title: (err as Error).message || '下单失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
}

watch([lots, leverage, direction], () => fetchEstimate());

onMounted(() => {
  const pages = getCurrentPages();
  const page = pages[pages.length - 1] as unknown as { options: Record<string, string> };
  if (page.options?.symbolId) symbolId.value = parseInt(page.options.symbolId);
  if (page.options?.direction) direction.value = page.options.direction;
  fetchEstimate();
});
</script>

<style scoped>
.order-page { min-height: 100vh; background: #f0f4f8; }
.form-container { padding: 16px 20px; }
.direction-tabs { display: flex; gap: 12px; margin-bottom: 20px; }
.tab { flex: 1; height: 44px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 600; color: #999; background: #e5e7eb; }
.buy-tab.active { background: #10b981; color: #fff; }
.sell-tab.active { background: #ef4444; color: #fff; }
.input-group { margin-bottom: 16px; }
.input-label { font-size: 14px; color: #333; font-weight: 500; margin-bottom: 6px; display: block; }
.input-field { width: 100%; height: 44px; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 0 16px; font-size: 15px; box-sizing: border-box; }
.leverage-row { display: flex; gap: 8px; flex-wrap: wrap; }
.leverage-btn { padding: 8px 14px; border-radius: 6px; font-size: 13px; background: #e5e7eb; color: #666; }
.leverage-btn.active { background: #2563eb; color: #fff; }
.estimate-card { background: #fff; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
.estimate-title { font-size: 14px; font-weight: 600; color: #1a1a1a; margin-bottom: 8px; display: block; }
.estimate-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; color: #666; }
.estimate-row.total { font-weight: 600; color: #1a1a1a; border-top: 1px solid #f3f4f6; padding-top: 8px; margin-top: 4px; }
.submit-btn { width: 100%; height: 48px; border-radius: 8px; font-size: 16px; font-weight: 600; border: none; color: #fff; }
.btn-buy { background: #10b981; }
.btn-sell { background: #ef4444; }
.submit-btn[disabled] { opacity: 0.6; }
</style>
