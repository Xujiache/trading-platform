<template>
  <view class="flows-page">
    <NavBar title="资金流水" :show-back="true" />
    <view v-if="flows.length" class="flow-list">
      <view v-for="item in flows" :key="item.id" class="flow-card">
        <view class="flow-left">
          <text class="flow-type">{{ typeText(item.flowType) }}</text>
          <text class="flow-remark">{{ item.remark || '-' }}</text>
        </view>
        <text class="flow-amount" :class="parseFloat(item.amount) >= 0 ? 'positive' : 'negative'">
          {{ parseFloat(item.amount) >= 0 ? '+' : '' }}{{ item.amount }}
        </text>
      </view>
    </view>
    <Empty v-else text="暂无流水记录" />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import NavBar from '../../components/NavBar.vue';
import Empty from '../../components/Empty.vue';
import { get } from '../../utils/request';

const flows = ref<Record<string, unknown>[]>([]);

function typeText(t: string) {
  const map: Record<string, string> = { deposit: '入金', withdraw: '出金', commission: '手续费', swap: '隔夜费', pnl: '盈亏', frozen: '冻结', unfrozen: '解冻' };
  return map[t] || t;
}

onMounted(async () => {
  try {
    const res = await get<{ list: Record<string, unknown>[] }>('/api/mobile/fund/flows');
    flows.value = res.list;
  } catch { /* handled */ }
});
</script>

<style scoped>
.flows-page { min-height: 100vh; background: #f0f4f8; }
.flow-list { padding: 12px 16px; }
.flow-card { display: flex; justify-content: space-between; align-items: center; background: #fff; border-radius: 8px; padding: 14px 16px; margin-bottom: 8px; }
.flow-type { font-size: 15px; font-weight: 500; color: #1a1a1a; display: block; }
.flow-remark { font-size: 12px; color: #999; margin-top: 4px; display: block; }
.flow-amount { font-size: 16px; font-weight: 600; font-family: 'SF Mono', monospace; }
.positive { color: #10b981; }
.negative { color: #ef4444; }
</style>
