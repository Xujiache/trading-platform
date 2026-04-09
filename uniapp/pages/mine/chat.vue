<template>
  <view class="chat-page">
    <NavBar title="在线客服" />

    <scroll-view class="message-list" scroll-y :scroll-into-view="scrollId">
      <view v-for="msg in messages" :key="msg.id" class="message-item" :class="msg.senderType === 'user' ? 'mine' : 'other'">
        <view class="bubble" :class="msg.senderType === 'user' ? 'mine-bubble' : 'other-bubble'">
          <text>{{ msg.content }}</text>
        </view>
        <text class="msg-time">{{ formatTime(msg.createdAt) }}</text>
      </view>
      <view id="bottom-anchor" />
    </scroll-view>

    <view class="input-bar">
      <input
        v-model="inputText"
        class="msg-input"
        placeholder="输入消息..."
        confirm-type="send"
        @confirm="sendMessage"
      />
      <view class="send-btn" @click="sendMessage">发送</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import NavBar from '../../components/NavBar.vue';
import { post, get } from '../../utils/request';
import dayjs from 'dayjs';

const messages = ref<any[]>([]);
const inputText = ref('');
const scrollId = ref('bottom-anchor');
const sessionId = ref(0);

function formatTime(date: string) {
  return dayjs(date).format('HH:mm');
}

onMounted(async () => {
  try {
    const session = await post<any>('/api/mobile/chat/session');
    sessionId.value = session.id;

    const res = await get<any>('/api/mobile/chat/messages', { sessionId: session.id });
    messages.value = res.list || res || [];
    scrollToBottom();
  } catch {}
});

async function sendMessage() {
  if (!inputText.value.trim() || !sessionId.value) return;

  messages.value.push({
    id: Date.now(),
    sessionId: sessionId.value,
    senderType: 'user',
    content: inputText.value,
    createdAt: new Date().toISOString(),
  });

  const text = inputText.value;
  inputText.value = '';
  scrollToBottom();

  try {
    await post('/api/mobile/chat/send', {
      sessionId: sessionId.value,
      content: text,
      type: 'text',
    });
  } catch {}
}

function scrollToBottom() {
  setTimeout(() => { scrollId.value = ''; scrollId.value = 'bottom-anchor'; }, 100);
}
</script>

<style scoped>
.chat-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;
}
.message-list {
  flex: 1;
  padding: 24rpx;
  overflow-y: auto;
}
.message-item {
  margin-bottom: 24rpx;
}
.message-item.mine {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.message-item.other {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.bubble {
  max-width: 70%;
  padding: 20rpx 28rpx;
  border-radius: 16rpx;
  font-size: 28rpx;
  line-height: 1.5;
  word-break: break-all;
}
.mine-bubble {
  background: #2563eb;
  color: #fff;
  border-bottom-right-radius: 4rpx;
}
.other-bubble {
  background: #fff;
  color: #333;
  border-bottom-left-radius: 4rpx;
}
.msg-time {
  font-size: 20rpx;
  color: #999;
  margin-top: 8rpx;
}
.input-bar {
  display: flex;
  align-items: center;
  padding: 16rpx 24rpx;
  background: #fff;
  border-top: 1rpx solid #e5e7eb;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
}
.msg-input {
  flex: 1;
  height: 72rpx;
  background: #f5f5f5;
  border-radius: 36rpx;
  padding: 0 28rpx;
  font-size: 28rpx;
}
.send-btn {
  margin-left: 16rpx;
  padding: 16rpx 32rpx;
  background: #2563eb;
  color: #fff;
  border-radius: 36rpx;
  font-size: 28rpx;
}
</style>
