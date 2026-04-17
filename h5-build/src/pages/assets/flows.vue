<template>
	<view class="flows-page">
		<CustomNavBar title="资金流水" />
		<view class="summary-bar">
			<view class="summary-item">
				<text class="summary-value text-green">${{formatMoney(summary.totalDeposit)}}</text>
				<text class="summary-label">累计入金</text>
			</view>
			<view class="summary-item">
				<text class="summary-value text-red">${{formatMoney(summary.totalWithdraw)}}</text>
				<text class="summary-label">累计出金</text>
			</view>
			<view class="summary-item" v-if="false">
				<text class="summary-value">${{formatMoney(summary.totalFees)}}</text>
				<text class="summary-label">累计费用</text>
			</view>
		</view>

		<view class="filter-bar">
			<scroll-view direction="horizontal" class="filter-scroll">
				<view class="filter-row">
					<view v-for="(f, idx) in filters" :key="idx" class="filter-item"
						:class="{'filter-active': activeFilter == f.value}" @click="changeFilter(f.value)">
						<text class="filter-text" :class="{'filter-text-active': activeFilter == f.value}">{{f.label}}</text>
					</view>
				</view>
			</scroll-view>
		</view>

		<scroll-view class="flows-scroll" direction="vertical" @scrolltolower="loadMore">
			<view v-for="(item, idx) in flows" :key="idx" class="flow-card" v-show="item.flow_type != 'commission' && item.flow_type != 'swap' && item.flow_type != 'spread' && item.flow_type != 'withdraw_fee'">
				<view class="flow-left">
					<text class="flow-type">{{getFlowTypeText(item.flow_type)}}</text>
					<text class="flow-desc">{{item.description}}</text>
					<text class="flow-time">{{formatTime(item.created_at)}}</text>
				</view>
				<view class="flow-right">
					<text class="flow-amount" :class="parseFloat(item.amount) >= 0 ? 'text-green' : 'text-red'">
						{{parseFloat(item.amount) >= 0 ? '+' : ''}}{{item.amount}}
					</text>
					<text class="flow-balance">余额: {{item.balance_after}}</text>
				</view>
			</view>
			<view v-if="flows.length == 0 && !loading" class="empty-view">
				<text class="empty-text">暂无流水记录</text>
			</view>
		</scroll-view>
	</view>
</template>

<script setup lang="ts">
	import CustomNavBar from '@/components/CustomNavBar.vue'
	import { ref, reactive } from 'vue'
	import { onShow } from '@dcloudio/uni-app'
	import { get } from '@/utils/request.uts'
	import { toBeijingTime } from '@/utils/timeUtils'

	type FilterOption = {
		label : string
		value : string
	}

	type FlowRecord = {
		id : number
		flow_type : string
		amount : string
		balance_after : string
		description : string
		created_at : string
	}

	type Summary = {
		totalDeposit : number
		totalWithdraw : number
		totalFees : number
	}

	const filters : FilterOption[] = [
		{ label: '全部', value: 'all' } as FilterOption,
		{ label: '入金', value: 'deposit' } as FilterOption,
		{ label: '出金', value: 'withdraw' } as FilterOption,
		{ label: '交易盈亏', value: 'trade_pnl' } as FilterOption,
	]

	const activeFilter = ref('all')
	const flows = ref([] as FlowRecord[])
	const page = ref(1)
	const loading = ref(false)
	const hasMore = ref(true)
	const summary = reactive({ totalDeposit: 0, totalWithdraw: 0, totalFees: 0 } as Summary)

	function formatMoney(val : number) : string {
		return val.toFixed(2)
	}

	function formatTime(t : string) : string {
		if (t == null) return '-'
		return toBeijingTime(t as string)
	}

	function getFlowTypeText(t : string) : string {
		if (t == 'deposit') return '入金'
		if (t == 'withdraw') return '出金'
		if (t == 'withdraw_fee') return '出金手续费'
		if (t == 'trade_pnl') return '交易盈亏'
		if (t == 'commission') return '手续费'
		if (t == 'spread') return '点差'
		if (t == 'swap') return '隔夜费'
		if (t == 'adjust') return '调整'
		if (t == 'demo_init') return '模拟初始资金'
		if (t == 'margin_freeze') return '保证金冻结'
		if (t == 'margin_release') return '保证金释放'
		return t
	}

	function changeFilter(val : string) {
		activeFilter.value = val
		loadFlows(true)
	}

	function loadFlows(isRefresh : boolean) {
		if (loading.value) return
		if (!isRefresh && !hasMore.value) return
		loading.value = true
		if (isRefresh) { page.value = 1; hasMore.value = true }

		let url = `/api/mobile/fund/flows?page=${page.value}&pageSize=20&accountType=real`
		if (activeFilter.value != 'all') {
			url = `${url}&flowType=${activeFilter.value}`
		}

		get(url).then((res) => {
			if (res.code == 200 && res.data != null) {
				const d = res.data as any
				const list = d['list'] as any[]
				const items = list.map((item : any) : FlowRecord => {
					return {
						id: (item['id'] as number) ?? 0,
						flow_type: (item['flow_type'] as string) ?? '',
						amount: (item['amount'] as string) ?? '0',
						balance_after: (item['balance_after'] as string) ?? '0',
						description: (item['description'] as string) ?? '',
						created_at: (item['created_at'] as string) ?? '',
					} as FlowRecord
				})
				if (isRefresh) {
					flows.value = items
				} else {
					flows.value = [...flows.value, ...items]
				}
				if (items.length < 20) hasMore.value = false
				page.value = page.value + 1

				const s = d['summary'] as any
				if (s != null) {
					summary.totalDeposit = (s['totalDeposit'] as number) ?? 0
					summary.totalWithdraw = (s['totalWithdraw'] as number) ?? 0
					summary.totalFees = (s['totalFees'] as number) ?? 0
				}
			}
			loading.value = false
		}).catch((_) => { loading.value = false })
	}

	function loadMore() { loadFlows(false) }

	onShow(() => { loadFlows(true) })
</script>

<style>
	.flows-page {
		flex: 1;
		background-color: var(--color-bg-page);
	}

	.summary-bar {
		flex-direction: row;
		background-color: var(--color-bg-card);
		padding: var(--spacing-xl) var(--spacing-lg);
		box-shadow: var(--shadow-sm);
	}

	.summary-item {
		flex: 1;
		align-items: center;
		padding: var(--spacing-xs) 0;
	}

	.summary-value {
		font-size: var(--font-lg);
		font-weight: 700;
		color: var(--color-text-primary);
		margin-bottom: var(--spacing-xs);
	}

	.summary-label {
		font-size: var(--font-xs);
		color: var(--color-text-muted);
	}

	.text-green {
		color: var(--color-success);
	}

	.text-red {
		color: var(--color-danger);
	}

	.filter-bar {
		background-color: var(--color-bg-card);
		border-top-width: 1px;
		border-top-style: solid;
		border-top-color: var(--color-divider);
	}

	.filter-scroll {
		height: 50px;
	}

	.filter-row {
		flex-direction: row;
		padding: 0 var(--spacing-md);
		height: 50px;
		align-items: center;
	}

	.filter-item {
		padding: var(--spacing-sm) var(--spacing-lg);
		margin-right: var(--spacing-sm);
		border-radius: var(--radius-pill);
		background-color: var(--color-bg-section);
		border-width: 1px;
		border-style: solid;
		border-color: var(--color-border-light);
		transition: all var(--transition-fast);
	}

	.filter-active {
		background: var(--gradient-primary);
		border-color: var(--color-primary);
		box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
	}

	.filter-text {
		font-size: var(--font-sm);
		color: var(--color-text-secondary);
		font-weight: 500;
	}

	.filter-text-active {
		color: var(--color-text-inverse);
	}

	.flows-scroll {
		flex: 1;
		padding: var(--spacing-md) var(--spacing-lg);
	}

	.flow-card {
		flex-direction: row;
		justify-content: space-between;
		background-color: var(--color-bg-card);
		border-radius: var(--radius-lg);
		padding: var(--spacing-lg);
		margin-bottom: var(--spacing-sm);
		box-shadow: var(--shadow-card);
	}

	.flow-left {
		flex: 1;
	}

	.flow-type {
		font-size: var(--font-base);
		font-weight: 700;
		color: var(--color-text-primary);
		margin-bottom: var(--spacing-xs);
	}

	.flow-desc {
		font-size: var(--font-xs);
		color: var(--color-text-secondary);
		margin-bottom: var(--spacing-xs);
	}

	.flow-time {
		font-size: var(--font-xs);
		color: var(--color-text-muted);
	}

	.flow-right {
		align-items: flex-end;
		justify-content: center;
	}

	.flow-amount {
		font-size: var(--font-lg);
		font-weight: 700;
		margin-bottom: var(--spacing-xs);
	}

	.flow-balance {
		font-size: var(--font-xs);
		color: var(--color-text-muted);
	}

	.empty-view {
		padding: 80px 0;
		align-items: center;
	}

	.empty-text {
		font-size: var(--font-sm);
		color: var(--color-text-muted);
	}
</style>
