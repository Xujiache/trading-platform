<template>
  <view class="records-page">
    <NavBar title="出金记录" :show-back="true" />
    <view v-if="records.length" class="record-list">
      <view v-for="item in records" :key="item.id" class="record-card">
        <view class="record-left">
          <text class="record-amount">¥{{ item.amount }}</text>
          <text class="record-time">{{ item.createdAt }}</text>
        </view>
        <text class="record-status" :class="'status-' + item.status">{{ statusText(item.status) }}</text>
      </view>
    </view>
    <Empty v-else text="暂无出金记录" />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import NavBar from '../../components/NavBar.vue';
import Empty from '../../components/Empty.vue';
import { get } from '../../utils/request';

const records = ref<Record<string, unknown>[]>([]);

function statusText(s: string) {
  const map: Record<string, string> = { pending: '待审核', approved: '审核通过', rejected: '已驳回', processing: '处理中', completed: '已完成' };
  return map[s] || s;
}

onMounted(async () => {
  try {
    const res = await get<{ list: Record<string, unknown>[] }>('/api/mobile/fund/withdraw/records');
    records.value = res.list;
  } catch { /* handled */ }
});
</script>

<style scoped>
.records-page { min-height: 100vh; background: #f0f4f8; }
.record-list { padding: 12px 16px; }
.record-card { display: flex; justify-content: space-between; align-items: center; background: #fff; border-radius: 8px; padding: 14px 16px; margin-bottom: 8px; }
.record-amount { font-size: 16px; font-weight: 600; color: #1a1a1a; display: block; }
.record-time { font-size: 12px; color: #999; margin-top: 4px; display: block; }
.record-status { font-size: 13px; font-weight: 500; }
.status-pending { color: #f59e0b; }
.status-approved { color: #3b82f6; }
.status-completed { color: #10b981; }
.status-rejected { color: #ef4444; }
</style>
