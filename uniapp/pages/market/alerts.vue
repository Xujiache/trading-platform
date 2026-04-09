<template>
  <view class="alerts-page">
    <NavBar title="行情预警" :show-back="true">
      <template #right>
        <text class="add-btn" @click="goAdd">+ 新增</text>
      </template>
    </NavBar>

    <view v-if="alerts.length" class="alert-list">
      <view v-for="item in alerts" :key="item.id" class="alert-card">
        <view class="alert-info">
          <text class="alert-symbol">{{ item.symbol?.name }}</text>
          <text class="alert-type">{{ typeText(item.alertType) }} {{ item.targetValue }}</text>
        </view>
        <view class="alert-actions">
          <text class="delete-btn" @click="handleDelete(item.id)">删除</text>
        </view>
      </view>
    </view>
    <Empty v-else text="暂无预警" />
  </view>
</template>

<script setup lang="ts">
/**
 * 预警列表页面
 */
import { ref, onMounted } from 'vue';
import NavBar from '../../components/NavBar.vue';
import Empty from '../../components/Empty.vue';
import { get, del } from '../../utils/request';

const alerts = ref<Record<string, unknown>[]>([]);

async function fetchAlerts() {
  try { alerts.value = await get('/api/mobile/alert'); } catch { /* handled */ }
}

function typeText(type: string) {
  const map: Record<string, string> = { price_above: '价格高于', price_below: '价格低于', change_percent: '涨跌幅超' };
  return map[type] || type;
}

async function handleDelete(id: number) {
  try {
    await del(`/api/mobile/alert/${id}`);
    fetchAlerts();
  } catch { /* handled */ }
}

function goAdd() { uni.navigateTo({ url: '/pages/market/alert-add' }); }

onMounted(() => fetchAlerts());
</script>

<style scoped>
.alerts-page { min-height: 100vh; background: #f0f4f8; }
.add-btn { color: #2563eb; font-size: 14px; }
.alert-list { padding: 12px 16px; }
.alert-card { display: flex; justify-content: space-between; align-items: center; background: #fff; border-radius: 8px; padding: 16px; margin-bottom: 8px; }
.alert-symbol { font-size: 15px; font-weight: 600; color: #1a1a1a; display: block; }
.alert-type { font-size: 13px; color: #666; margin-top: 4px; display: block; }
.delete-btn { color: #ef4444; font-size: 14px; }
</style>
