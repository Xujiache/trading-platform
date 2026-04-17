<template>
	<view class="records-page">
		<CustomNavBar title="入金记录" />
		<scroll-view class="records-scroll" direction="vertical" @scrolltolower="loadMore">
			<view v-for="(item, idx) in records" :key="idx" class="record-card">
				<view class="record-header">
					<text class="record-method">{{getMethodText(item.payment_method)}}</text>
					<text class="record-status" :class="getStatusClass(item.status)">{{getStatusText(item.status)}}</text>
				</view>
				<view class="record-body">
					<text class="record-amount">${{item.amount}}</text>
					<text class="record-no">单号: {{item.deposit_no}}</text>
				</view>
				<view class="record-footer">
					<text class="record-time">{{formatTime(item.created_at)}}</text>
					<text v-if="item.remark != ''" class="record-remark">{{item.remark}}</text>
				</view>
			</view>
			<view v-if="records.length == 0 && !loading" class="empty-view">
				<text class="empty-text">暂无入金记录</text>
			</view>
		</scroll-view>
	</view>
</template>

<script setup lang="ts">
	import CustomNavBar from '@/components/CustomNavBar.vue'
	import { ref } from 'vue'
	import { onShow } from '@dcloudio/uni-app'
	import { get } from '@/utils/request.uts'
	import { toBeijingTime } from '@/utils/timeUtils'

	type DepositRecord = {
		id : number
		deposit_no : string
		amount : string
		payment_method : string
		remark : string
		status : string
		created_at : string
	}

	const records = ref([] as DepositRecord[])
	const page = ref(1)
	const loading = ref(false)
	const hasMore = ref(true)

	function getMethodText(m : string) : string {
		if (m == 'wechat') return '微信支付'
		if (m == 'alipay') return '支付宝'
		if (m == 'usdt') return 'USDT'
		return m
	}

	function getStatusText(s : string) : string {
		if (s == 'pending') return '待审核'
		if (s == 'reviewing') return '审核中'
		if (s == 'completed') return '已完成'
		if (s == 'failed') return '已驳回'
		if (s == 'cancelled') return '已取消'
		return s
	}

	function getStatusClass(s : string) : string {
		if (s == 'completed') return 'status-success'
		if (s == 'failed' || s == 'cancelled') return 'status-fail'
		return 'status-pending'
	}

	function formatTime(t : string) : string {
		if (t == null) return '-'
		return toBeijingTime(t as string)
	}

	function loadRecords(isRefresh : boolean) {
		if (loading.value) return
		if (!isRefresh && !hasMore.value) return
		loading.value = true
		if (isRefresh) { page.value = 1; hasMore.value = true }

		get(`/api/mobile/fund/deposits?page=${page.value}&pageSize=20`).then((res) => {
			if (res.code == 200 && res.data != null) {
				const d = res.data as any
				const list = d['list'] as any[]
				const items = list.map((item : any) : DepositRecord => {
					return {
						id: (item['id'] as number) ?? 0,
						deposit_no: (item['deposit_no'] as string) ?? '',
						amount: (item['amount'] as string) ?? '0',
						payment_method: (item['payment_method'] as string) ?? '',
						remark: (item['remark'] as string) ?? '',
						status: (item['status'] as string) ?? '',
						created_at: (item['created_at'] as string) ?? '',
					} as DepositRecord
				})
				if (isRefresh) {
					records.value = items
				} else {
					records.value = [...records.value, ...items]
				}
				if (items.length < 20) hasMore.value = false
				page.value = page.value + 1
			}
			loading.value = false
		}).catch((_) => { loading.value = false })
	}

	function loadMore() {
		loadRecords(false)
	}

	onShow(() => { loadRecords(true) })
</script>

<style>
	.records-page {
		flex: 1;
		background-color: var(--color-bg-page);
	}

	.records-scroll {
		flex: 1;
		padding: var(--spacing-lg);
	}

	.record-card {
		background-color: var(--color-bg-card);
		border-radius: var(--radius-lg);
		padding: var(--spacing-lg);
		margin-bottom: var(--spacing-md);
		box-shadow: var(--shadow-card);
		border-left-width: 4px;
		border-left-style: solid;
		border-left-color: var(--color-warning);
	}

	.record-header {
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--spacing-md);
	}

	.record-method {
		font-size: var(--font-base);
		font-weight: 700;
		color: var(--color-text-primary);
	}

	.record-status {
		font-size: var(--font-xs);
		padding: var(--spacing-xs) var(--spacing-md);
		border-radius: var(--radius-pill);
		font-weight: 600;
	}

	.status-success {
		color: var(--color-success);
		background-color: var(--color-success-bg);
	}

	.status-fail {
		color: var(--color-danger);
		background-color: var(--color-danger-bg);
	}

	.status-pending {
		color: var(--color-warning);
		background-color: var(--color-warning-bg);
	}

	.record-body {
		margin-bottom: var(--spacing-md);
		padding-bottom: var(--spacing-md);
		border-bottom-width: 1px;
		border-bottom-style: solid;
		border-bottom-color: var(--color-divider);
	}

	.record-amount {
		font-size: var(--font-2xl);
		font-weight: 700;
		color: var(--color-text-primary);
		margin-bottom: var(--spacing-xs);
	}

	.record-no {
		font-size: var(--font-xs);
		color: var(--color-text-muted);
	}

	.record-footer {
		flex-direction: row;
		justify-content: space-between;
	}

	.record-time {
		font-size: var(--font-xs);
		color: var(--color-text-muted);
	}

	.record-remark {
		font-size: var(--font-xs);
		color: var(--color-text-secondary);
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
