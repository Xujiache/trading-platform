<template>
  <view class="ticket-detail-page">
    <NavBar title="工单详情" :show-back="true" />
    <view v-if="ticket" class="detail-content">
      <view class="info-card">
        <text class="ticket-title">{{ ticket.title }}</text>
        <text class="ticket-content">{{ ticket.content }}</text>
      </view>
      <view v-if="replies.length" class="reply-list">
        <view v-for="(r, idx) in replies" :key="idx" class="reply-item" :class="r.sender">
          <text class="reply-sender">{{ r.sender === 'user' ? '我' : '客服' }}</text>
          <text class="reply-content">{{ r.content }}</text>
        </view>
      </view>
      <view class="reply-input">
        <input v-model="replyContent" class="input-field" placeholder="输入回复内容" />
        <button class="send-btn" @click="handleReply">发送</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import NavBar from '../../components/NavBar.vue';
import { get, post } from '../../utils/request';

const ticket = ref<Record<string, unknown> | null>(null);
const replies = ref<Array<{ sender: string; content: string }>>([]);
const replyContent = ref('');

onMounted(async () => {
  const pages = getCurrentPages();
  const page = pages[pages.length - 1] as unknown as { options: Record<string, string> };
  const id = page.options?.id;
  if (!id) return;
  try {
    ticket.value = await get(`/api/mobile/ticket/${id}`);
    replies.value = (ticket.value?.replies as Array<{ sender: string; content: string }>) || [];
  } catch {}
});

async function handleReply() {
  if (!replyContent.value || !ticket.value) return;
  try {
    await post(`/api/mobile/ticket/${ticket.value.id}/reply`, { content: replyContent.value });
    replies.value.push({ sender: 'user', content: replyContent.value });
    replyContent.value = '';
  } catch {}
}
</script>

<style scoped>
.ticket-detail-page { min-height: 100vh; background: #f0f4f8; }
.info-card { margin: 16px; background: #fff; border-radius: 8px; padding: 16px; }
.ticket-title { font-size: 16px; font-weight: 600; color: #1a1a1a; display: block; }
.ticket-content { font-size: 14px; color: #666; margin-top: 8px; display: block; line-height: 1.6; }
.reply-list { padding: 0 16px; }
.reply-item { background: #fff; border-radius: 8px; padding: 12px; margin-bottom: 8px; }
.reply-item.admin { border-left: 3px solid #2563eb; }
.reply-sender { font-size: 12px; color: #999; display: block; }
.reply-content { font-size: 14px; color: #333; margin-top: 4px; display: block; }
.reply-input { display: flex; gap: 8px; padding: 16px; position: fixed; bottom: 0; left: 0; right: 0; background: #fff; }
.input-field { flex: 1; height: 40px; background: #f3f4f6; border: none; border-radius: 20px; padding: 0 16px; font-size: 14px; }
.send-btn { width: 64px; height: 40px; background: #2563eb; color: #fff; border-radius: 20px; border: none; font-size: 14px; }
</style>
