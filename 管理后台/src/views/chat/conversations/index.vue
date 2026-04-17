<template>
  <div class="chat-page art-full-height">
    <ElRow :gutter="16" style="height: 100%">
      <ElCol :span="8">
        <ElCard shadow="never" style="height: 100%">
          <template #header>
            <div class="flex-between">
              <span class="font-bold">会话列表</span>
              <ElSelect v-model="statusFilter" placeholder="全部" clearable size="small" style="width: 100px" @change="loadConversations">
                <ElOption label="待接入" value="waiting" />
                <ElOption label="进行中" value="active" />
                <ElOption label="已关闭" value="closed" />
              </ElSelect>
            </div>
          </template>
          <div class="conversation-list">
            <div v-for="c in conversations" :key="c.id"
              :class="['conv-item', { active: c.id === currentConvId }]"
              @click="selectConversation(c)">
              <div class="conv-header">
                <span class="conv-user">{{ c.user_nickname || c.user_email || `用户${c.user_id}` }}</span>
                <ElTag :type="getConvStatusType(c.status)" size="small">{{ getConvStatusText(c.status) }}</ElTag>
              </div>
              <div class="conv-msg">{{ c.last_message || '暂无消息' }}</div>
              <div class="conv-time">{{ c.last_message_at || c.created_at }}</div>
              <ElBadge v-if="c.admin_unread > 0" :value="c.admin_unread" class="conv-badge" />
            </div>
          </div>
        </ElCard>
      </ElCol>

      <ElCol :span="16">
        <ElCard shadow="never" style="height: 100%">
          <template v-if="currentConvId">
            <div class="chat-header flex-between mb-4">
              <span class="font-bold">{{ currentConv?.user_nickname || currentConv?.user_email || '' }}</span>
              <div>
                <ElButton v-if="currentConv?.status === 'waiting'" type="success" size="small" @click="doAssign">接入</ElButton>
                <ElButton v-if="currentConv?.status !== 'closed'" type="danger" size="small" @click="doClose">关闭</ElButton>
              </div>
            </div>

            <div class="message-area" ref="msgAreaRef">
              <div v-for="m in messages" :key="m.id" :class="['msg-item', m.sender_type]">
                <div class="msg-sender">{{ m.sender_type === 'user' ? '用户' : m.sender_type === 'admin' ? '客服' : '系统' }}</div>
                <div class="msg-content">{{ m.content }}</div>
                <div class="msg-time">{{ m.created_at }}</div>
              </div>
            </div>

            <div class="input-area" v-if="currentConv?.status !== 'closed'">
              <ElInput v-model="inputMsg" placeholder="输入消息..." @keyup.enter="doSend">
                <template #append>
                  <ElButton type="primary" @click="doSend">发送</ElButton>
                </template>
              </ElInput>
            </div>
          </template>
          <template v-else>
            <div class="empty-state">请选择一个会话</div>
          </template>
        </ElCard>
      </ElCol>
    </ElRow>
  </div>
</template>

<script setup lang="ts">
import { fetchConversations, fetchChatMessages, sendChatMessage, assignConversation, closeConversation } from '@/api/admin-chat'

defineOptions({ name: 'ChatConversations' })

const statusFilter = ref('')
const conversations = ref<any[]>([])
const currentConvId = ref(0)
const currentConv = ref<any>(null)
const messages = ref<any[]>([])
const inputMsg = ref('')
const msgAreaRef = ref<HTMLElement>()

function getConvStatusText(s: string) {
  const map: Record<string, string> = { waiting: '待接入', active: '进行中', closed: '已关闭' }
  return map[s] || s
}

function getConvStatusType(s: string) {
  const map: Record<string, string> = { waiting: 'warning', active: 'success', closed: 'info' }
  return (map[s] || 'info') as any
}

async function loadConversations() {
  try {
    const params: any = { pageSize: 100 }
    if (statusFilter.value) params.status = statusFilter.value
    const res = await fetchConversations(params)
    if (res?.list) conversations.value = res.list
  } catch { /* handled */ }
}

async function selectConversation(c: any) {
  currentConvId.value = c.id
  currentConv.value = c
  await loadMessages()
}

async function loadMessages() {
  try {
    const res = await fetchChatMessages(currentConvId.value, { pageSize: 200 })
    if (res?.list) messages.value = res.list
    nextTick(() => scrollToBottom())
  } catch { /* handled */ }
}

function scrollToBottom() {
  if (msgAreaRef.value) msgAreaRef.value.scrollTop = msgAreaRef.value.scrollHeight
}

async function doSend() {
  if (!inputMsg.value.trim()) return
  await sendChatMessage({ conversation_id: currentConvId.value, content: inputMsg.value })
  inputMsg.value = ''
  await loadMessages()
}

async function doAssign() {
  await assignConversation({ conversation_id: currentConvId.value })
  loadConversations()
  loadMessages()
}

async function doClose() {
  await closeConversation({ conversation_id: currentConvId.value })
  loadConversations()
  loadMessages()
}

let pollTimer: any = null
onMounted(() => {
  loadConversations()
  pollTimer = setInterval(() => {
    if (currentConvId.value) loadMessages()
    loadConversations()
  }, 5000)
})
onUnmounted(() => { if (pollTimer) clearInterval(pollTimer) })
</script>

<style scoped>
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.conversation-list { max-height: calc(100vh - 200px); overflow-y: auto; }
.conv-item { padding: 12px; border-bottom: 1px solid #f0f0f0; cursor: pointer; position: relative; }
.conv-item:hover { background: #f5f7fa; }
.conv-item.active { background: #ecf5ff; border-left: 3px solid #409eff; }
.conv-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.conv-user { font-weight: bold; font-size: 14px; }
.conv-msg { color: #909399; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.conv-time { color: #c0c4cc; font-size: 11px; margin-top: 4px; }
.conv-badge { position: absolute; right: 12px; top: 12px; }
.message-area { height: calc(100vh - 300px); overflow-y: auto; padding: 16px; background: #f5f5f5; border-radius: 4px; }
.msg-item { margin-bottom: 16px; }
.msg-item.user .msg-content { background: #fff; }
.msg-item.admin .msg-content { background: #ecf5ff; }
.msg-item.system .msg-content { background: #fdf6ec; text-align: center; font-size: 12px; color: #e6a23c; }
.msg-sender { font-size: 12px; color: #909399; margin-bottom: 4px; }
.msg-content { display: inline-block; padding: 8px 12px; border-radius: 6px; max-width: 80%; word-break: break-word; }
.msg-time { font-size: 11px; color: #c0c4cc; margin-top: 2px; }
.input-area { margin-top: 16px; }
.empty-state { display: flex; justify-content: center; align-items: center; height: 400px; color: #909399; font-size: 16px; }
</style>
