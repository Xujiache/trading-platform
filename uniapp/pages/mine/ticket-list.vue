<template>
  <view class="ticket-list-page">
    <NavBar title="我的工单" :show-back="true">
      <template #right><text class="create-btn" @click="goCreate">提交工单</text></template>
    </NavBar>
    <view v-if="tickets.length" class="ticket-list">
      <view v-for="item in tickets" :key="item.id" class="ticket-card" @click="goDetail(item)">
        <view class="ticket-info"><text class="ticket-title">{{ item.title }}</text><text class="ticket-time">{{ item.createdAt }}</text></view>
        <text class="ticket-status" :class="'status-' + item.status">{{ statusText(item.status) }}</text>
      </view>
    </view>
    <Empty v-else text="暂无工单" />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import NavBar from '../../components/NavBar.vue';
import Empty from '../../components/Empty.vue';
import { get } from '../../utils/request';

const tickets = ref<Record<string, unknown>[]>([]);

function statusText(s: string) { const map: Record<string, string> = { open: '待处理', processing: '处理中', resolved: '已解决', closed: '已关闭' }; return map[s] || s; }
function goCreate() { uni.navigateTo({ url: '/pages/mine/ticket-create' }); }
function goDetail(item: Record<string, unknown>) { uni.navigateTo({ url: `/pages/mine/ticket-detail?id=${item.id}` }); }

onMounted(async () => { try { tickets.value = await get('/api/mobile/ticket'); } catch {} });
</script>

<style scoped>
.ticket-list-page { min-height: 100vh; background: #f0f4f8; }
.create-btn { color: #2563eb; font-size: 14px; }
.ticket-list { padding: 12px 16px; }
.ticket-card { display: flex; justify-content: space-between; align-items: center; background: #fff; border-radius: 8px; padding: 14px 16px; margin-bottom: 8px; }
.ticket-title { font-size: 15px; font-weight: 500; color: #1a1a1a; display: block; }
.ticket-time { font-size: 12px; color: #999; margin-top: 4px; display: block; }
.ticket-status { font-size: 13px; font-weight: 500; }
.status-open { color: #f59e0b; }
.status-processing { color: #3b82f6; }
.status-resolved { color: #10b981; }
.status-closed { color: #999; }
</style>
