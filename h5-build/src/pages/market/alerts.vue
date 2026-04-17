<template>
	<view class="alerts-page">
		<CustomNavBar title="价格预警" />
		<scroll-view class="filter-bar" direction="horizontal" :show-scrollbar="false">
			<view class="filter-list">
				<view v-for="(f, idx) in filters" :key="idx" class="filter-chip"
					:class="{'filter-active': activeFilter == idx}" @click="switchFilter(idx)">
					<text class="filter-text" :class="{'filter-text-active': activeFilter == idx}">{{f.label}}</text>
				</view>
			</view>
		</scroll-view>

		<scroll-view class="alert-list" direction="vertical">
			<view v-for="(item, idx) in alertList" :key="idx" class="alert-card">
				<view class="alert-header">
					<view class="alert-symbol-row">
						<text class="alert-symbol">{{item.symbol}}</text>
						<text class="alert-symbol-name">{{item.symbol_name}}</text>
					</view>
					<view class="alert-status-badge" :class="getStatusClass(item.status)">
						<text class="alert-status-text">{{getStatusLabel(item.status)}}</text>
					</view>
				</view>
				<view class="alert-body">
					<text class="alert-type">{{getTypeLabel(item.alert_type)}}</text>
					<text class="alert-target">目标值: {{item.target_value}}</text>
				</view>
				<view class="alert-footer">
					<text class="alert-time">{{formatTime(item.created_at)}}</text>
					<text class="alert-delete" @click="deleteAlert(item.id)">删除</text>
				</view>
			</view>

			<view v-if="alertList.length == 0" class="empty-view">
				<text class="empty-text">暂无预警</text>
				<text class="empty-action" @click="goAddAlert">去添加预警</text>
			</view>
		</scroll-view>

		<view class="fab-btn" @click="goAddAlert">
			<text class="fab-text">+</text>
		</view>
	</view>
</template>

<script setup lang="ts">
	import CustomNavBar from '@/components/CustomNavBar.vue'
	import { ref } from 'vue'
	import { onLoad, onShow } from '@dcloudio/uni-app'
	import { get, del } from '@/utils/request.uts'
	import { toBeijingTime } from '@/utils/timeUtils'

	type AlertItem = {
		id : number
		symbol : string
		symbol_name : string
		alert_type : string
		target_value : number
		notify_method : string
		status : string
		created_at : string
	}

	const filters = [
		{ key: '', label: '全部' },
		{ key: 'active', label: '生效中' },
		{ key: 'triggered', label: '已触发' },
		{ key: 'disabled', label: '已禁用' },
	]

	const activeFilter = ref(0)
	const alertList = ref<AlertItem[]>([])

	onLoad(() => {
		loadAlerts()
	})

	onShow(() => {
		loadAlerts()
	})

	function loadAlerts() {
		const statusKey = filters[activeFilter.value].key
		let url = '/api/mobile/market/alerts?limit=50'
		if (statusKey.length > 0) {
			url = `${url}&status=${statusKey}`
		}

		get(url).then((res) => {
			if (res.code == 200 && res.data != null) {
				const d = res.data as any
				const listRaw = d['list'] as any[] | null
				if (listRaw != null && listRaw!.length > 0) {
					const items : AlertItem[] = []
					for (let i = 0; i < listRaw!.length; i++) {
						const a = listRaw![i] as any
						items.push({
							id: (a['id'] as number) ?? 0,
							symbol: (a['symbol'] as string) ?? '',
							symbol_name: (a['symbol_name'] as string) ?? '',
							alert_type: (a['alert_type'] as string) ?? '',
							target_value: parseFloat((a['target_value'] ?? '0') + ''),
							notify_method: (a['notify_method'] as string) ?? '',
							status: (a['status'] as string) ?? '',
							note: (a['note'] as string) ?? '',
							created_at: (a['created_at'] as string) ?? '',
						} as AlertItem)
					}
					alertList.value = items
				} else {
					alertList.value = []
				}
			}
		}).catch((_e : any) => { })
	}

	function switchFilter(idx : number) {
		activeFilter.value = idx
		loadAlerts()
	}

	function deleteAlert(id : number) {
		uni.showModal({
			title: '确认删除',
			content: '确定要删除这条预警吗？',
			success: (modalRes) => {
				if (modalRes.confirm) {
					del(`/api/mobile/market/alerts/${id}`).then((res) => {
						if (res.code == 200) {
							uni.showToast({ title: '删除成功', icon: 'success' })
							loadAlerts()
						}
					}).catch((_e : any) => { })
				}
			}
		})
	}

	function goAddAlert() {
		uni.navigateTo({ url: '/pages/market/add-alert' })
	}

	function getTypeLabel(type : string) : string {
		if (type == 'price_above') return '价格高于'
		if (type == 'price_below') return '价格低于'
		if (type == 'change_percent') return '涨跌幅达'
		return type
	}

	function getStatusLabel(status : string) : string {
		if (status == 'active') return '生效中'
		if (status == 'triggered') return '已触发'
		if (status == 'disabled') return '已禁用'
		return status
	}

	function getStatusClass(status : string) : string {
		if (status == 'active') return 'status-active'
		if (status == 'triggered') return 'status-triggered'
		return 'status-disabled'
	}

	function formatTime(t : any) : string {
		if (t == null) return '-'
		return toBeijingTime(t as string)
	}
</script>

<style>
	.alerts-page {
		flex: 1;
		background-color: var(--color-bg-page);
	}

	.filter-bar {
		height: 52px;
		background-color: var(--color-bg-card);
		border-bottom-width: 1px;
		border-bottom-color: var(--color-border-light);
		border-bottom-style: solid;
	}

	.filter-list {
		flex-direction: row;
		align-items: center;
		padding: 0 var(--spacing-md);
		height: 52px;
	}

	.filter-chip {
		padding: var(--spacing-sm) var(--spacing-lg);
		margin: 0 var(--spacing-xs);
		border-radius: var(--radius-pill);
		background-color: var(--color-bg-section);
		border-width: 1px;
		border-color: transparent;
		border-style: solid;
		transition-property: background-color, border-color;
		transition-duration: var(--transition-fast);
	}

	.filter-active {
		background-color: var(--color-primary-bg);
		border-color: var(--color-primary);
	}

	.filter-text {
		font-size: var(--font-xs);
		color: var(--color-text-secondary);
		font-weight: 500;
	}

	.filter-text-active {
		color: var(--color-primary);
		font-weight: 700;
	}

	.alert-list {
		flex: 1;
		padding: var(--spacing-md) var(--spacing-lg);
	}

	.alert-card {
		background-color: var(--color-bg-card);
		border-radius: var(--radius-lg);
		padding: var(--spacing-lg);
		margin-bottom: var(--spacing-md);
		border-left-width: 4px;
		border-left-color: var(--color-primary);
		border-left-style: solid;
		box-shadow: var(--shadow-card);
	}

	.alert-header {
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--spacing-md);
	}

	.alert-symbol-row {
		flex-direction: row;
		align-items: center;
	}

	.alert-symbol {
		font-size: var(--font-md);
		font-weight: 700;
		color: var(--color-text-primary);
		margin-right: var(--spacing-sm);
		letter-spacing: 0.3px;
	}

	.alert-symbol-name {
		font-size: var(--font-xs);
		color: var(--color-text-muted);
	}

	.alert-status-badge {
		padding: 3px var(--spacing-md);
		border-radius: var(--radius-pill);
	}

	.status-active {
		background-color: var(--color-success-bg);
	}

	.status-triggered {
		background-color: var(--color-warning-bg);
	}

	.status-disabled {
		background-color: var(--color-bg-section);
	}

	.status-active .alert-status-text {
		color: var(--color-success);
		font-weight: 700;
	}

	.status-triggered .alert-status-text {
		color: var(--color-warning);
		font-weight: 700;
	}

	.status-disabled .alert-status-text {
		color: var(--color-text-muted);
		font-weight: 600;
	}

	.alert-status-text {
		font-size: var(--font-xs);
		font-weight: 600;
	}

	.alert-body {
		flex-direction: row;
		align-items: center;
		margin-bottom: var(--spacing-md);
		padding: var(--spacing-sm) var(--spacing-md);
		background-color: var(--color-bg-section);
		border-radius: var(--radius-sm);
	}

	.alert-type {
		font-size: var(--font-sm);
		color: var(--color-text-secondary);
		margin-right: var(--spacing-sm);
		font-weight: 500;
	}

	.alert-target {
		font-size: var(--font-sm);
		color: var(--color-text-primary);
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.alert-footer {
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		padding-top: var(--spacing-sm);
		border-top-width: 1px;
		border-top-color: var(--color-divider);
		border-top-style: solid;
	}

	.alert-time {
		font-size: var(--font-xs);
		color: var(--color-text-muted);
	}

	.alert-delete {
		font-size: var(--font-xs);
		color: var(--color-danger);
		font-weight: 600;
	}

	.empty-view {
		padding: 100px 0;
		justify-content: center;
		align-items: center;
	}

	.empty-text {
		font-size: var(--font-md);
		color: var(--color-text-muted);
		margin-bottom: var(--spacing-lg);
	}

	.empty-action {
		font-size: var(--font-sm);
		color: var(--color-primary);
		font-weight: 600;
		padding: var(--spacing-sm) var(--spacing-xl);
		border-radius: var(--radius-pill);
		border-width: 1px;
		border-color: var(--color-primary);
		border-style: solid;
	}

	.fab-btn {
		position: fixed;
		right: 20px;
		bottom: 80px;
		width: 56px;
		height: 56px;
		border-radius: 28px;
		background-image: var(--gradient-primary);
		justify-content: center;
		align-items: center;
		box-shadow: var(--shadow-lg);
	}

	.fab-text {
		font-size: 28px;
		color: var(--color-text-inverse);
		font-weight: 300;
		line-height: 28px;
	}
</style>
