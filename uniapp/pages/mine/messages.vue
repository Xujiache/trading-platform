<template>
  <view class="messages-page">
    <NavBar title="消息中心" :show-back="true">
      <template #right><text class="read-all" @click="markAllRead">全部已读</text></template>
    </NavBar>
    <view v-if="messages.length" class="msg-list">
      <view v-for="item in messages" :key="item.id" class="msg-card" :class="{ unread: !item.isRead }" @click="markRead(item)">
        <text class="msg-title">{{ item.title }}</text>
        <text class="msg-content">{{ item.content }}</text>
        <text class="msg-time">{{ item.createdAt }}</text>
      </view>
    </view>
    <Empty v-else text="暂无消息" />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import NavBar from '../../components/NavBar.vue';
import Empty from '../../components/Empty.vue';
import { get, put } from '../../utils/request';

const messages = ref<Record<string, unknown>[]>([]);

async function fetchMessages() {
  try { const res = await get<{ list: Record<string, unknown>[] }>('/api/mobile/notification'); messages.value = res.list; } catch {}
}

async function markRead(item: Record<string, unknown>) {
  if (!item.isRead) { try { await put(`/api/mobile/notification/${item.id}/read`); item.isRead = true; } catch {} }
}

async function markAllRead() {
  try { await put('/api/mobile/notification/read-all'); messages.value.forEach(m => m.isRead = true); } catch {}
}

onMounted(() => fetchMessages());
</script>

<style scoped>
.messages-page { min-height: 100vh; background: #f0f4f8; }
.read-all { color: #2563eb; font-size: 14px; }
.msg-list { padding: 12px 16px; }
.msg-card { background: #fff; border-radius: 8px; padding: 14px 16px; margin-bottom: 8px; }
.msg-card.unread { border-left: 3px solid #2563eb; }
.msg-title { font-size: 15px; font-weight: 600; color: #1a1a1a; display: block; }
.msg-content { font-size: 13px; color: #666; margin-top: 6px; display: block; overflow: hidden; text-overflow: ellipsis; }
.msg-time { font-size: 12px; color: #999; margin-top: 6px; display: block; }
</style>
