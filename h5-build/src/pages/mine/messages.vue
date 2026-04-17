<template>
	<view class="msg-page">
		<CustomNavBar title="消息中心" />
		<view class="tab-bar">
			<view v-for="tab in tabs" :key="tab.key" :class="['tab-item', { active: currentTab == tab.key }]" @click="switchTab(tab.key)">
				<text :class="['tab-text', { active: currentTab == tab.key }]">{{tab.label}}</text>
			</view>
		</view>
		<scroll-view class="msg-list" direction="vertical">
			<view v-if="list.length == 0" class="empty"><text class="empty-text">暂无消息</text></view>
			<view v-for="item in list" :key="item.id" class="msg-item" @click="markRead(item)">
				<view class="msg-header">
					<text class="msg-type">{{getTypeText(item.type)}}</text>
					<view v-if="!item.is_read" class="unread-dot"></view>
				</view>
				<text class="msg-title">{{item.title}}</text>
				<text class="msg-content">{{item.content}}</text>
				<text class="msg-time">{{item.created_at}}</text>
			</view>
		</scroll-view>
		<view class="read-all-btn" @click="readAll"><text class="read-all-text">全部已读</text></view>
	</view>
</template>

<script setup lang="ts">
	import CustomNavBar from '@/components/CustomNavBar.vue'
	import { ref } from 'vue'
	import { onShow } from '@dcloudio/uni-app'
	import { get, post } from '../../utils/request.uts'

	type MsgItem = { id : number; type : string; title : string; content : string; is_read : boolean; created_at : string; ref_id : number }
	type TabItem = { key : string; label : string }

	const tabs = ref<TabItem[]>([
		{ key: '', label: '全部' }, { key: 'system', label: '系统' },
		{ key: 'trade', label: '交易' }, { key: 'fund', label: '资金' }, { key: 'announcement', label: '公告' }
	])
	const currentTab = ref('')
	const list = ref<MsgItem[]>([])

	onShow(() => { loadMessages() })

	function switchTab(key : string) { currentTab.value = key; loadMessages() }

	function getTypeText(t : string) : string {
		if (t == 'system') return '系统'
		if (t == 'trade') return '交易'
		if (t == 'fund') return '资金'
		if (t == 'announcement') return '公告'
		return t
	}

	function loadMessages() {
		let url = '/api/mobile/notification/list?pageSize=50'
		if (currentTab.value.length > 0) url += `&type=${currentTab.value}`
		get(url).then((res) => {
			if (res.code == 200 && res.data != null) {
				const d = res.data as any
				const items = d['list'] as any[]
				if (items != null) {
					const arr : MsgItem[] = []
					for (let i = 0; i < items.length; i++) {
						const it = items[i]
						arr.push({
							id: (it['id'] as number) ?? 0, type: (it['type'] as string) ?? '',
							title: (it['title'] as string) ?? '', content: (it['content'] as string) ?? '',
							is_read: (it['is_read'] as number) == 1, created_at: (it['created_at'] as string) ?? '',
							ref_id: (it['ref_id'] as number) ?? 0
						} as MsgItem)
					}
					list.value = arr
				}
			}
		}).catch((_e) => {})
	}

	function markRead(item : MsgItem) {
		if (!item.is_read) {
			post(`/api/mobile/notification/${item.id}/read`).then((_r) => { loadMessages() }).catch((_e) => {})
		}
		if (item.type == 'announcement' && item.ref_id > 0) {
			uni.navigateTo({ url: `/pages/mine/announcement-detail?id=${item.ref_id}` })
		}
	}

	function readAll() {
		post('/api/mobile/notification/read-all').then((_r) => {
			uni.showToast({ title: '已全部已读', icon: 'success' })
			loadMessages()
		}).catch((_e) => {})
	}
</script>

<style>
	.msg-page {
		flex: 1;
		background-color: var(--color-bg-page);
	}

	.tab-bar {
		flex-direction: row;
		background-color: var(--color-bg-card);
		padding: 0 var(--spacing-sm);
		border-bottom-width: 1px;
		border-bottom-style: solid;
		border-bottom-color: var(--color-divider);
	}

	.tab-item {
		padding: var(--spacing-md) var(--spacing-md);
	}

	.tab-text {
		font-size: var(--font-sm);
		color: var(--color-text-muted);
		font-weight: 500;
	}

	.tab-text.active {
		color: var(--color-primary);
		font-weight: 700;
	}

	.msg-list {
		flex: 1;
		padding-top: var(--spacing-sm);
	}

	.empty {
		padding: 60px;
		align-items: center;
	}

	.empty-text {
		font-size: var(--font-sm);
		color: var(--color-text-muted);
	}

	.msg-item {
		margin: var(--spacing-sm) var(--spacing-lg);
		padding: var(--spacing-lg);
		background-color: var(--color-bg-card);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-card);
	}

	.msg-header {
		flex-direction: row;
		align-items: center;
		margin-bottom: var(--spacing-sm);
	}

	.msg-type {
		font-size: var(--font-xs);
		color: var(--color-primary);
		background-color: var(--color-primary-bg);
		padding: 2px var(--spacing-sm);
		border-radius: var(--radius-sm);
		font-weight: 600;
	}

	.unread-dot {
		width: 8px;
		height: 8px;
		border-radius: 4px;
		background-color: var(--color-danger);
		margin-left: var(--spacing-sm);
	}

	.msg-title {
		font-size: var(--font-md);
		font-weight: 600;
		color: var(--color-text-primary);
		margin-bottom: var(--spacing-xs);
	}

	.msg-content {
		font-size: var(--font-sm);
		color: var(--color-text-secondary);
		margin-bottom: var(--spacing-sm);
		line-height: 20px;
	}

	.msg-time {
		font-size: var(--font-xs);
		color: var(--color-text-muted);
	}

	.read-all-btn {
		margin: var(--spacing-lg);
		margin-bottom: var(--spacing-2xl);
		padding: var(--spacing-md);
		background-color: var(--color-primary-bg);
		border-radius: var(--radius-md);
		align-items: center;
		border-width: 1px;
		border-style: solid;
		border-color: var(--color-primary);
	}

	.read-all-text {
		font-size: var(--font-sm);
		color: var(--color-primary);
		font-weight: 600;
	}
</style>
