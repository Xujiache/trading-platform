<template>
  <div class="chat-page">
    <a-page-header title="客服管理" />
    <a-row :gutter="16">
      <a-col :span="8">
        <a-card title="会话列表">
          <a-select v-model="statusFilter" placeholder="状态筛选" style="width: 100%; margin-bottom: 12px" allow-clear>
            <a-option value="waiting">等待中</a-option>
            <a-option value="active">进行中</a-option>
            <a-option value="closed">已关闭</a-option>
          </a-select>
          <a-list :data="sessions" :loading="loading">
            <template #item="{ item }">
              <a-list-item :class="{ active: currentSession?.id === item.id }" @click="selectSession(item)" style="cursor: pointer; padding: 8px">
                <a-list-item-meta :title="item.user?.nickname || `用户#${item.userId}`" :description="item.status === 'waiting' ? '等待接入' : item.status === 'active' ? '对话中' : '已关闭'" />
              </a-list-item>
            </template>
          </a-list>
        </a-card>
      </a-col>
      <a-col :span="16">
        <a-card :title="currentSession ? `会话 #${currentSession.id}` : '请选择会话'">
          <template v-if="currentSession">
            <div style="height: 400px; overflow-y: auto; padding: 12px; background: #f5f5f5; margin-bottom: 12px">
              <div v-for="msg in messages" :key="msg.id" :style="{ textAlign: msg.senderType === 'admin' ? 'right' : 'left', marginBottom: '8px' }">
                <a-tag :color="msg.senderType === 'admin' ? 'blue' : 'gray'" style="max-width: 70%; white-space: pre-wrap; text-align: left">{{ msg.content }}</a-tag>
              </div>
            </div>
            <a-space>
              <a-button v-if="currentSession.status === 'waiting'" type="primary" @click="handleAssign">接单</a-button>
              <a-button v-if="currentSession.status === 'active'" status="danger" @click="handleClose">关闭会话</a-button>
            </a-space>
          </template>
          <a-empty v-else description="选择左侧会话查看详情" />
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { Message } from '@arco-design/web-vue';
import { getChatSessions, getSessionMessages, assignSession, closeSession } from '../../api/chat';

const sessions = ref<any[]>([]);
const messages = ref<any[]>([]);
const currentSession = ref<any>(null);
const loading = ref(false);
const statusFilter = ref('');

async function fetchSessions() {
  loading.value = true;
  try {
    const res = await getChatSessions({ status: statusFilter.value || undefined }) as any;
    sessions.value = res.list || res || [];
  } finally { loading.value = false; }
}

async function selectSession(session: any) {
  currentSession.value = session;
  const res = await getSessionMessages(session.id) as any;
  messages.value = res.list || res || [];
}

async function handleAssign() {
  await assignSession(currentSession.value.id);
  Message.success('接单成功');
  fetchSessions();
}

async function handleClose() {
  await closeSession(currentSession.value.id);
  Message.success('已关闭');
  currentSession.value = null;
  fetchSessions();
}

watch(statusFilter, fetchSessions);
onMounted(fetchSessions);
</script>
