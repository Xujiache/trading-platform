<template>
	<view class="chat-page">
		<CustomNavBar title="在线客服" />
		<scroll-view class="msg-area" direction="vertical" :scroll-top="scrollTop" scroll-with-animation>
			<view v-if="messages.length === 0" class="empty-chat">
				<image class="empty-chat-icon" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 24 24' fill='none' stroke='%23CBD5E1' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'/%3E%3C/svg%3E" mode="aspectFit"></image>
				<text class="empty-chat-text">欢迎联系在线客服，请描述您的问题</text>
			</view>
			<view v-for="(msg, idx) in messages" :key="msg.id" class="msg-item-wrap">
				<view v-if="shouldShowTime(idx)" class="time-divider">
					<text class="time-divider-text">{{formatTime(msg.created_at)}}</text>
				</view>
				<view :class="['msg-row', msg.sender_type]">
					<view class="msg-avatar" v-if="msg.sender_type === 'admin' || msg.sender_type === 'system'">
						<text class="avatar-text">{{ msg.sender_type === 'system' ? 'S' : '服' }}</text>
					</view>
					<view class="msg-content-wrap">
						<view :class="['msg-bubble', msg.sender_type]">
							<text class="msg-text">{{msg.content}}</text>
						</view>
					</view>
					<view class="msg-avatar" v-if="msg.sender_type === 'user'">
						<text class="avatar-text">我</text>
					</view>
				</view>
			</view>
		</scroll-view>

		<view class="input-bar" v-if="convStatus != 'closed'">
			<input class="msg-input" v-model="inputText" placeholder="输入消息..." @confirm="sendMsg" />
			<view class="send-btn" @click="sendMsg">
				<text class="send-text">发送</text>
			</view>
		</view>
		<view class="closed-bar" v-else>
			<text class="closed-text">会话已关闭</text>
		</view>
	</view>
</template>

<script setup lang="ts">
	import CustomNavBar from '@/components/CustomNavBar.vue'
	import { ref } from 'vue'
	import { onLoad, onUnload } from '@dcloudio/uni-app'
	import { get, post } from '../../utils/request.uts'
	import { toBeijingTimeShort } from '@/utils/timeUtils'

	type ChatMsg = { id : number; sender_type : string; content : string; created_at : string }

	const convId = ref(0)
	const convStatus = ref('')
	const messages = ref<ChatMsg[]>([])
	const inputText = ref('')
	const scrollTop = ref(0)
	let pollTimer : number = 0

	onLoad(() => { initConversation() })

	onUnload(() => { if (pollTimer > 0) clearInterval(pollTimer) })

	function initConversation() {
		get('/api/mobile/chat/conversation').then((res) => {
			if (res.code == 200 && res.data != null) {
				const d = res.data as any
				convId.value = (d['id'] as number) ?? 0
				convStatus.value = (d['status'] as string) ?? ''
				loadMessages()
				pollTimer = setInterval(() => { loadMessages() }, 3000)
			}
		}).catch((_e) => {})
	}

	function loadMessages() {
		if (convId.value == 0) return
		get(`/api/mobile/chat/messages?conversation_id=${convId.value}&pageSize=200`).then((res) => {
			if (res.code == 200 && res.data != null) {
				const d = res.data as any
				const items = d['list'] as any[]
				if (items != null) {
					const arr : ChatMsg[] = []
					for (let i = 0; i < items.length; i++) {
						const it = items[i]
						arr.push({
							id: (it['id'] as number) ?? 0,
							sender_type: (it['sender_type'] as string) ?? '',
							content: (it['content'] as string) ?? '',
							created_at: (it['created_at'] as string) ?? ''
						} as ChatMsg)
					}
					messages.value = arr
					scrollToBottom()
				}
			}
		}).catch((_e) => {})
	}

	function scrollToBottom() {
		setTimeout(() => { scrollTop.value = messages.value.length * 200 }, 100)
	}

	function sendMsg() {
		if (inputText.value.length == 0) return
		post('/api/mobile/chat/send', { conversation_id: convId.value, content: inputText.value } as any).then((res) => {
			if (res.code == 200) {
				inputText.value = ''
				loadMessages()
			} else { uni.showToast({ title: res.msg, icon: 'none' }) }
		}).catch((_e) => {})
	}
	function shouldShowTime(idx: number): boolean {
		if (idx === 0) return true
		const currentMsg = messages.value[idx]
		const prevMsg = messages.value[idx - 1]
		if (!currentMsg.created_at || !prevMsg.created_at) return false
		try {
			const current = new Date(currentMsg.created_at).getTime()
			const prev = new Date(prevMsg.created_at).getTime()
			// Show time if gap is more than 5 minutes (300000 ms)
			return (current - prev) > 300000
		} catch (e) {
			return false
		}
	}

	function formatTime(timeStr: string) {
		if (!timeStr) return ''
		return toBeijingTimeShort(timeStr)
	}
</script>

<style>
	.chat-page {
		flex: 1;
		background-color: var(--color-bg-page);
	}

	.msg-area {
		flex: 1;
		padding: var(--spacing-lg);
	}

	.msg-row {
		margin-bottom: var(--spacing-lg);
		display: flex;
		flex-direction: row;
		align-items: flex-end;
	}

	.msg-row.user {
		justify-content: flex-end;
	}

	.msg-row.admin {
		justify-content: flex-start;
	}

	.msg-row.system {
		justify-content: center;
	}

	.msg-avatar {
		width: 36px;
		height: 36px;
		border-radius: 18px;
		background-color: var(--color-border);
		display: flex;
		justify-content: center;
		align-items: center;
		margin: 0 8px;
		flex-shrink: 0;
	}

	.msg-row.user .msg-avatar {
		background-color: var(--color-primary-light);
	}

	.msg-row.admin .msg-avatar {
		background-color: var(--color-accent);
	}

	.time-divider {
		display: flex;
		flex-direction: row;
		justify-content: center;
		margin-bottom: var(--spacing-lg);
	}

	.time-divider-text {
		font-size: 11px;
		color: #FFFFFF;
		background-color: rgba(0, 0, 0, 0.15);
		padding: 2px 8px;
		border-radius: 10px;
	}

	.empty-chat {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 60px 0;
	}

	.empty-chat-icon {
		width: 64px;
		height: 64px;
		margin-bottom: 16px;
		opacity: 0.6;
	}

	.empty-chat-text {
		font-size: 13px;
		color: var(--color-text-muted);
	}

	.msg-item-wrap {
		display: flex;
		flex-direction: column;
	}

	.avatar-text {
		color: white;
		font-size: 14px;
		font-weight: 600;
	}

	.msg-content-wrap {
		display: flex;
		flex-direction: column;
		max-width: 75%;
	}

	.msg-row.user .msg-content-wrap {
		align-items: flex-end;
	}

	.msg-row.admin .msg-content-wrap {
		align-items: flex-start;
	}

	.msg-bubble {
		padding: var(--spacing-sm) var(--spacing-md);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-sm);
	}

	.msg-bubble.user {
		background-color: var(--color-primary);
		border-bottom-right-radius: var(--radius-sm);
	}

	.msg-bubble.admin {
		background-color: var(--color-bg-card);
		border-bottom-left-radius: var(--radius-sm);
	}

	.msg-bubble.system {
		background-color: var(--color-warning-bg);
	}

	.msg-bubble.user .msg-text {
		color: var(--color-text-inverse);
	}

	.msg-text {
		font-size: var(--font-sm);
		color: var(--color-text-primary);
		line-height: 22px;
	}

	.msg-time {
		font-size: var(--font-xs);
		color: var(--color-text-muted);
		margin-top: var(--spacing-xs);
	}

	.input-bar {
		flex-direction: row;
		padding: var(--spacing-sm) var(--spacing-lg);
		background-color: var(--color-bg-card);
		align-items: center;
		border-top-width: 1px;
		border-top-style: solid;
		border-top-color: var(--color-border-light);
		box-shadow: var(--shadow-md);
	}

	.msg-input {
		flex: 1;
		background-color: var(--color-bg-input);
		border-radius: var(--radius-pill);
		padding: var(--spacing-sm) var(--spacing-lg);
		font-size: var(--font-sm);
		margin-right: var(--spacing-sm);
		border-width: 1px;
		border-style: solid;
		border-color: var(--color-border-light);
	}

	.send-btn {
		padding: var(--spacing-sm) var(--spacing-xl);
		background-image: var(--gradient-primary);
		border-radius: var(--radius-pill);
		box-shadow: var(--shadow-btn);
	}

	.send-text {
		font-size: var(--font-sm);
		color: var(--color-text-inverse);
		font-weight: 600;
	}

	.closed-bar {
		padding: var(--spacing-lg);
		background-color: var(--color-bg-card);
		align-items: center;
		border-top-width: 1px;
		border-top-style: solid;
		border-top-color: var(--color-border-light);
	}

	.closed-text {
		font-size: var(--font-sm);
		color: var(--color-text-muted);
	}
</style>
