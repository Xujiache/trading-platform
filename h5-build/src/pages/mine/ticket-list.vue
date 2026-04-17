<template>
	<view class="ticket-page">
		<CustomNavBar title="我的工单" />
		<view class="tab-bar">
			<view v-for="tab in tabs" :key="tab.key" :class="['tab-item', { active: currentTab == tab.key }]" @click="switchTab(tab.key)">
				<text :class="['tab-text', { active: currentTab == tab.key }]">{{tab.label}}</text>
			</view>
		</view>
		<scroll-view class="ticket-list" direction="vertical">
			<view v-if="list.length == 0" class="empty"><text class="empty-text">暂无工单</text></view>
			<view v-for="item in list" :key="item.id" class="ticket-item" @click="goDetail(item.id)">
				<view class="ticket-header">
					<text class="ticket-no">{{item.ticket_no}}</text>
					<text :class="'ticket-status status-' + item.status">{{getStatusText(item.status)}}</text>
				</view>
				<text class="ticket-title">{{item.title}}</text>
				<text class="ticket-time">{{item.created_at}}</text>
			</view>
		</scroll-view>
		<view class="create-btn" @click="goCreate">
			<text class="create-text">创建工单</text>
		</view>
	</view>
</template>

<script setup lang="ts">
	import CustomNavBar from '@/components/CustomNavBar.vue'
	import { ref } from 'vue'
	import { onShow } from '@dcloudio/uni-app'
	import { get } from '../../utils/request.uts'

	type TicketItem = { id : number; ticket_no : string; title : string; status : string; created_at : string }
	type TabItem = { key : string; label : string }

	const tabs = ref<TabItem[]>([
		{ key: '', label: '全部' }, { key: 'pending', label: '待处理' },
		{ key: 'processing', label: '处理中' }, { key: 'resolved', label: '已解决' }
	])
	const currentTab = ref('')
	const list = ref<TicketItem[]>([])

	onShow(() => { loadTickets() })

	function switchTab(key : string) { currentTab.value = key; loadTickets() }

	function getStatusText(s : string) : string {
		if (s == 'pending') return '待处理'
		if (s == 'processing') return '处理中'
		if (s == 'resolved') return '已解决'
		if (s == 'closed') return '已关闭'
		return s
	}

	function loadTickets() {
		let url = '/api/mobile/ticket/list?pageSize=50'
		if (currentTab.value.length > 0) url += `&status=${currentTab.value}`
		get(url).then((res) => {
			if (res.code == 200 && res.data != null) {
				const d = res.data as any
				const items = d['list'] as any[]
				if (items != null) {
					const arr : TicketItem[] = []
					for (let i = 0; i < items.length; i++) {
						const it = items[i]
						arr.push({
							id: (it['id'] as number) ?? 0, ticket_no: (it['ticket_no'] as string) ?? '',
							title: (it['title'] as string) ?? '', status: (it['status'] as string) ?? '',
							created_at: (it['created_at'] as string) ?? ''
						} as TicketItem)
					}
					list.value = arr
				}
			}
		}).catch((_e) => {})
	}

	function goDetail(id : number) { uni.navigateTo({ url: `/pages/mine/ticket-detail?id=${id}` }) }
	function goCreate() { uni.navigateTo({ url: '/pages/mine/ticket-create' }) }
</script>

<style>
	.ticket-page {
		flex: 1;
		background-color: var(--color-bg-page);
	}

	.tab-bar {
		flex-direction: row;
		background-color: var(--color-bg-card);
		padding: 0 var(--spacing-sm);
		border-bottom-width: 1px;
		border-bottom-style: solid;
		border-bottom-color: var(--color-border-light);
	}

	.tab-item {
		padding: var(--spacing-md) var(--spacing-md);
	}

	.tab-text {
		font-size: var(--font-sm);
		color: var(--color-text-muted);
		transition: color var(--transition-fast);
	}

	.tab-text.active {
		color: var(--color-primary);
		font-weight: 600;
	}

	.ticket-list {
		flex: 1;
		padding-top: var(--spacing-xs);
	}

	.empty {
		padding: 60px var(--spacing-xl);
		align-items: center;
	}

	.empty-text {
		font-size: var(--font-sm);
		color: var(--color-text-muted);
	}

	.ticket-item {
		margin: var(--spacing-sm) var(--spacing-lg);
		padding: var(--spacing-lg);
		background-color: var(--color-bg-card);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-card);
	}

	.ticket-header {
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--spacing-sm);
	}

	.ticket-no {
		font-size: var(--font-xs);
		color: var(--color-text-muted);
		font-family: monospace;
	}

	.ticket-status {
		font-size: var(--font-xs);
		padding: 3px var(--spacing-sm);
		border-radius: var(--radius-pill);
		font-weight: 600;
	}

	.status-pending {
		color: var(--color-danger);
		background-color: var(--color-danger-bg);
	}

	.status-processing {
		color: var(--color-warning);
		background-color: var(--color-warning-bg);
	}

	.status-resolved {
		color: var(--color-success);
		background-color: var(--color-success-bg);
	}

	.status-closed {
		color: var(--color-text-muted);
		background-color: var(--color-bg-section);
	}

	.ticket-title {
		font-size: var(--font-md);
		color: var(--color-text-primary);
		font-weight: 600;
		margin-bottom: var(--spacing-xs);
	}

	.ticket-time {
		font-size: var(--font-xs);
		color: var(--color-text-muted);
	}

	.create-btn {
		margin: var(--spacing-lg);
		padding: var(--spacing-md);
		background-image: var(--gradient-primary);
		border-radius: var(--radius-md);
		align-items: center;
		box-shadow: var(--shadow-btn);
	}

	.create-text {
		font-size: var(--font-md);
		color: var(--color-text-inverse);
		font-weight: 600;
	}
</style>
