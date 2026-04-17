<template>
	<view class="trade-page">
		<view class="account-card">
			<view class="account-header">
				<text class="account-title">{{accountType == 'demo' ? '模拟账户' : '实盘账户'}}</text>
				<view class="account-switch" @click="switchAccountType">
					<text class="switch-text">切换</text>
				</view>
			</view>
			<view class="equity-row">
				<text class="equity-label">净值</text>
				<text class="equity-value">${{formatMoney(accountInfo.equity)}}</text>
			</view>
			<view class="account-stats">
				<view class="stat-item">
					<text class="stat-label">余额</text>
					<text class="stat-value">${{formatMoney(accountInfo.balance)}}</text>
				</view>
				<view class="stat-item">
					<text class="stat-label">浮动盈亏</text>
					<text class="stat-value" :class="accountInfo.floatingPnl >= 0 ? 'text-green' : 'text-red'">
						{{accountInfo.floatingPnl >= 0 ? '+' : ''}}{{formatMoney(accountInfo.floatingPnl)}}
					</text>
				</view>
				<view class="stat-item">
					<text class="stat-label">已用保证金</text>
					<text class="stat-value">${{formatMoney(accountInfo.frozenMargin)}}</text>
				</view>
				<view class="stat-item">
					<text class="stat-label">可用保证金</text>
					<text class="stat-value">${{formatMoney(accountInfo.availableMargin)}}</text>
				</view>
			</view>
		</view>

		<view class="action-bar">
			<view class="action-btn action-btn-primary" @click="goPlaceOrder">
				<image class="action-btn-icon" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M12 5v14M5 12h14'/%3E%3C/svg%3E" mode="aspectFit"></image>
				<text class="action-btn-text-light">下单交易</text>
			</view>
			<view class="action-btn action-btn-danger" @click="closeAll">
				<image class="action-btn-icon" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6'/%3E%3C/svg%3E" mode="aspectFit"></image>
				<text class="action-btn-text-light">一键平仓</text>
			</view>
		</view>

		<view class="tab-bar">
			<view v-for="(tab, idx) in tabs" :key="idx" class="tab-item" :class="{'tab-item-active': activeTab == idx}"
				@click="activeTab = idx">
				<text class="tab-text" :class="{'tab-text-active': activeTab == idx}">
					{{tab}}{{idx == 0 && positions.length > 0 ? `(${positions.length})` : ''}}
				</text>
			</view>
		</view>

		<scroll-view class="content-scroll" direction="vertical" @scrolltolower="loadMore">
			<view v-if="activeTab == 0">
				<view v-for="(item, idx) in positions" :key="idx" class="order-card" @click="goOrderDetail(item.id)">
					<view class="order-header">
						<text class="order-symbol">{{item.symbol}}</text>
						<view class="direction-badge" :class="item.direction == 'buy' ? 'badge-buy' : 'badge-sell'">
							<text class="direction-text">{{item.direction == 'buy' ? '买入' : '卖出'}}</text>
						</view>
						<text class="order-lots">{{item.lots}}手</text>
					</view>
					<view class="order-body">
						<view class="order-col">
							<text class="col-label">开仓价</text>
							<text class="col-value">{{item.open_price}}</text>
						</view>
						<view class="order-col">
							<text class="col-label">现价</text>
							<text class="col-value">{{item.currentPrice ?? '-'}}</text>
						</view>
						<view class="order-col">
							<text class="col-label">盈亏</text>
							<text class="col-value"
								:class="parseFloat(item.floating_pnl + '') >= 0 ? 'text-green' : 'text-red'">
								{{parseFloat(item.floating_pnl + '') >= 0 ? '+' : ''}}{{formatMoney(parseFloat(item.floating_pnl + ''))}}
							</text>
						</view>
					</view>
					<view class="order-footer">
						<text class="order-time">{{formatTime(item.opened_at)}}</text>
						<view class="close-btn" @click.stop="closeSingle(item.id)">
							<text class="close-btn-text">平仓</text>
						</view>
					</view>
				</view>
				<view v-if="positions.length == 0" class="empty-view">
					<image class="empty-icon" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 24 24' fill='none' stroke='%23CBD5E1' stroke-width='1' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'/%3E%3Cline x1='3' y1='9' x2='21' y2='9'/%3E%3Cline x1='9' y1='21' x2='9' y2='9'/%3E%3C/svg%3E" mode="aspectFit"></image>
					<text class="empty-text">暂无持仓订单</text>
				</view>
			</view>

			<view v-if="activeTab == 1">
				<view v-for="(item, idx) in pendingOrders" :key="idx" class="order-card">
					<view class="order-header">
						<text class="order-symbol">{{item.symbol}}</text>
						<view class="direction-badge" :class="item.direction == 'buy' ? 'badge-buy' : 'badge-sell'">
							<text class="direction-text">{{getPendingTypeText(item.pending_type)}}</text>
						</view>
						<text class="order-lots">{{item.lots}}手</text>
					</view>
					<view class="order-body">
						<view class="order-col">
							<text class="col-label">目标价</text>
							<text class="col-value">{{item.target_price}}</text>
						</view>
						<view class="order-col">
							<text class="col-label">现价</text>
							<text class="col-value">{{item.currentBid ?? '-'}}</text>
						</view>
					</view>
					<view class="order-footer">
						<text class="order-time">{{formatTime(item.created_at)}}</text>
						<view class="close-btn" @click="cancelPending(item.id)">
							<text class="close-btn-text">撤销</text>
						</view>
					</view>
				</view>
				<view v-if="pendingOrders.length == 0" class="empty-view">
					<image class="empty-icon" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 24 24' fill='none' stroke='%23CBD5E1' stroke-width='1' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Cpolyline points='12 6 12 12 16 14'/%3E%3C/svg%3E" mode="aspectFit"></image>
					<text class="empty-text">暂无挂单记录</text>
				</view>
			</view>

			<view v-if="activeTab == 2">
				<view v-for="(item, idx) in historyOrders" :key="idx" class="order-card"
					@click="goHistoryDetail(item)">
					<view class="order-header">
						<text class="order-symbol">{{item.symbol}}</text>
						<view class="direction-badge" :class="item.direction == 'buy' ? 'badge-buy' : 'badge-sell'">
							<text class="direction-text">{{item.direction == 'buy' ? '买入' : '卖出'}}</text>
						</view>
						<text class="order-status">{{getHistoryStatusText(item)}}</text>
					</view>
					<view class="order-body">
						<view class="order-col">
							<text class="col-label">开仓价</text>
							<text class="col-value">{{item.open_price}}</text>
						</view>
						<view class="order-col">
							<text class="col-label">平仓价</text>
							<text class="col-value">{{item.close_price ?? '-'}}</text>
						</view>
						<view class="order-col">
							<text class="col-label">净盈亏</text>
							<text class="col-value"
								:class="parseFloat((item.net_pnl ?? '0') + '') >= 0 ? 'text-green' : 'text-red'">
								{{formatMoney(parseFloat((item.net_pnl ?? '0') + ''))}}
							</text>
						</view>
					</view>
					<view class="order-footer">
						<text class="order-time">{{formatTime(item.closed_at ?? item.created_at)}}</text>
						<text class="close-type-text">{{getCloseTypeText(item.close_type)}}</text>
					</view>
				</view>
				<view v-if="historyOrders.length == 0" class="empty-view">
					<image class="empty-icon" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 24 24' fill='none' stroke='%23CBD5E1' stroke-width='1' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'/%3E%3Cpolyline points='14 2 14 8 20 8'/%3E%3Cline x1='16' y1='13' x2='8' y2='13'/%3E%3Cline x1='16' y1='17' x2='8' y2='17'/%3E%3Cpolyline points='10 9 9 9 8 9'/%3E%3C/svg%3E" mode="aspectFit"></image>
					<text class="empty-text">暂无历史订单</text>
				</view>
			</view>
		</scroll-view>
		<FloatingTabBar :current="2" />
	</view>
</template>

<script setup lang="ts">
	import { ref, reactive } from 'vue'
	import { onShow, onHide } from '@dcloudio/uni-app'
	import { get, post, del } from '@/utils/request.uts'
	import FloatingTabBar from '../../components/FloatingTabBar.vue'
	import { toBeijingTime } from '@/utils/timeUtils'

	type AccountInfo = {
		balance : number
		equity : number
		frozenMargin : number
		availableMargin : number
		floatingPnl : number
		openPositions : number
	}

	const tabs = ['持仓', '挂单', '历史']
	const activeTab = ref(0)
	const savedAccType = uni.getStorageSync('preferredAccountType') as string
	const accountType = ref(savedAccType.length > 0 ? savedAccType : 'demo')
	const accountInfo = reactive({
		balance: 0,
		equity: 0,
		frozenMargin: 0,
		availableMargin: 0,
		floatingPnl: 0,
		openPositions: 0,
	} as AccountInfo)

	const positions = ref<any[]>([])
	const pendingOrders = ref<any[]>([])
	const historyOrders = ref<any[]>([])
	const historyPage = ref(1)
	let refreshTimer = 0

	onShow(() => {
		loadAccount()
		loadPositions()
		loadPendings()
		loadHistory()
		refreshTimer = setInterval(() => {
			loadAccount()
			loadPositions()
		}, 3000) as number
	})

	onHide(() => {
		if (refreshTimer > 0) {
			clearInterval(refreshTimer)
			refreshTimer = 0
		}
	})

	function loadAccount() {
		get(`/api/mobile/trade/account?accountType=${accountType.value}`).then((res) => {
			if (res.code == 200 && res.data != null) {
				const d = res.data as any
				accountInfo.balance = (d['balance'] as number) ?? 0
				accountInfo.equity = (d['equity'] as number) ?? 0
				accountInfo.frozenMargin = (d['frozenMargin'] as number) ?? 0
				accountInfo.availableMargin = (d['availableMargin'] as number) ?? 0
				accountInfo.floatingPnl = (d['floatingPnl'] as number) ?? 0
				accountInfo.openPositions = (d['openPositions'] as number) ?? 0
			}
		}).catch((_e : any) => { })
	}

	function loadPositions() {
		get(`/api/mobile/trade/positions?accountType=${accountType.value}`).then((res) => {
			if (res.code == 200 && res.data != null) {
				const arr = JSON.parse<any[]>(JSON.stringify(res.data))
				if (arr != null) {
					positions.value = arr!
				}
			}
		}).catch((_e : any) => { })
	}

	function loadPendings() {
		get(`/api/mobile/trade/pendings?accountType=${accountType.value}`).then((res) => {
			if (res.code == 200 && res.data != null) {
				const arr = JSON.parse<any[]>(JSON.stringify(res.data))
				if (arr != null) {
					pendingOrders.value = arr!
				}
			}
		}).catch((_e : any) => { })
	}

	function loadHistory() {
		get(`/api/mobile/trade/orders?accountType=${accountType.value}&status=closed,cancelled&page=${historyPage.value}&pageSize=20`).then((res) => {
			if (res.code == 200 && res.data != null) {
				const d = res.data as any
				const list = d['list'] as any[]
				if (list != null) {
					if (historyPage.value == 1) {
						historyOrders.value = list
					} else {
						for (let i = 0; i < list.length; i++) {
							historyOrders.value.push(list[i])
						}
					}
				}
			}
		}).catch((_e : any) => { })
	}

	function loadMore() {
		if (activeTab.value == 2) {
			historyPage.value++
			loadHistory()
		}
	}

	function switchAccountType() {
		accountType.value = accountType.value == 'demo' ? 'real' : 'demo'
		uni.setStorageSync('preferredAccountType', accountType.value)
		historyPage.value = 1
		loadAccount()
		loadPositions()
		loadPendings()
		loadHistory()
	}

	function goPlaceOrder() {
		uni.navigateTo({ url: `/pages/trade/place-order?accountType=${accountType.value}` })
	}

	function goOrderDetail(orderId : any) {
		uni.navigateTo({ url: `/pages/trade/order-detail?id=${orderId}` })
	}

	function goHistoryDetail(item : any) {
		const recordType = (item['record_type'] ?? 'order') as string
		const id = item['id']
		uni.navigateTo({ url: `/pages/trade/order-detail?id=${id}&record_type=${recordType}` })
	}

	function closeSingle(orderId : any) {
		uni.showModal({
			title: '确认平仓',
			content: '确定要平仓该订单吗？',
			success: (modalRes) => {
				if (modalRes.confirm) {
					post(`/api/mobile/trade/close/${orderId}`, {}).then((res) => {
						if (res.code == 200) {
							uni.showToast({ title: '平仓成功', icon: 'success' })
							loadAccount()
							loadPositions()
						} else {
							uni.showToast({ title: res.msg, icon: 'none' })
						}
					}).catch((_e : any) => {
						uni.showToast({ title: '平仓失败', icon: 'none' })
					})
				}
			}
		})
	}

	function closeAll() {
		if (positions.value.length == 0) {
			uni.showToast({ title: '暂无持仓', icon: 'none' })
			return
		}
		uni.showModal({
			title: '一键平仓',
			content: `确定要平仓全部 ${positions.value.length} 笔持仓吗？`,
			success: (modalRes) => {
				if (modalRes.confirm) {
					post('/api/mobile/trade/close-all', { accountType: accountType.value }).then((res) => {
						if (res.code == 200) {
							uni.showToast({ title: '一键平仓完成', icon: 'success' })
							loadAccount()
							loadPositions()
						} else {
							uni.showToast({ title: res.msg, icon: 'none' })
						}
					}).catch((_e : any) => {
						uni.showToast({ title: '操作失败', icon: 'none' })
					})
				}
			}
		})
	}

	function cancelPending(pendingId : any) {
		uni.showModal({
			title: '撤销挂单',
			content: '确定要撤销该挂单吗？',
			success: (modalRes) => {
				if (modalRes.confirm) {
					del(`/api/mobile/trade/pending/${pendingId}`).then((res) => {
						if (res.code == 200) {
							uni.showToast({ title: '已撤销', icon: 'success' })
							loadPendings()
						} else {
							uni.showToast({ title: res.msg, icon: 'none' })
						}
					}).catch((_e : any) => {
						uni.showToast({ title: '撤销失败', icon: 'none' })
					})
				}
			}
		})
	}

	function formatMoney(val : number) : string {
		return val.toFixed(2)
	}

	function formatTime(t : any) : string {
		if (t == null) return '-'
		return toBeijingTime(t as string)
	}

	function getPendingTypeText(t : any) : string {
		const s = t as string
		if (s == 'buy_limit') return '买入限价'
		if (s == 'buy_stop') return '买入止损'
		if (s == 'sell_limit') return '卖出限价'
		if (s == 'sell_stop') return '卖出止损'
		return s
	}

	function getHistoryStatusText(item : any) : string {
		const status = (item['status'] ?? '') as string
		const recordType = (item['record_type'] ?? '') as string
		if (status == 'closed') return '已平仓'
		if (status == 'cancelled' && recordType == 'pending') return '挂单已撤销'
		if (status == 'expired') return '挂单已过期'
		if (status == 'cancelled') return '已取消'
		return status
	}

	function getCloseTypeText(t : any) : string {
		if (t == null) return ''
		const s = t as string
		if (s == 'manual') return '手动平仓'
		if (s == 'stop_loss') return '止损平仓'
		if (s == 'take_profit') return '止盈平仓'
		if (s == 'admin') return '管理员平仓'
		if (s == 'trailing_stop') return '移动止损'
		return s
	}
</script>

<style>
	.trade-page {
		flex: 1;
		background-color: var(--color-bg-page);
	}

	.account-card {
		margin: var(--spacing-md) var(--spacing-md) var(--spacing-sm);
		padding: var(--spacing-xl) var(--spacing-lg);
		background: linear-gradient(145deg, #1E293B 0%, #0F172A 100%);
		border-radius: var(--radius-xl);
		box-shadow: 0 8px 24px rgba(15, 23, 42, 0.2);
		position: relative;
		overflow: hidden;
	}

	.account-card::before {
		content: '';
		position: absolute;
		top: -50%;
		right: -20%;
		width: 200px;
		height: 200px;
		background: radial-gradient(circle, rgba(37, 99, 235, 0.15) 0%, rgba(0, 0, 0, 0) 70%);
		border-radius: 50%;
		pointer-events: none;
	}

	.account-header {
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--spacing-lg);
	}

	.account-title {
		font-size: var(--font-sm);
		color: rgba(255, 255, 255, 0.7);
		font-weight: 600;
		letter-spacing: 1px;
	}

	.account-switch {
		padding: 6px 14px;
		border-radius: var(--radius-pill);
		background-color: rgba(255, 255, 255, 0.1);
		border-width: 1px;
		border-color: rgba(255, 255, 255, 0.15);
		border-style: solid;
		transition: all var(--transition-fast);
	}

	.account-switch:active {
		background-color: rgba(255, 255, 255, 0.2);
		transform: scale(0.95);
	}

	.switch-text {
		font-size: var(--font-xs);
		color: var(--color-text-inverse);
		font-weight: 600;
		letter-spacing: 0.5px;
	}

	.equity-row {
		margin-bottom: var(--spacing-xl);
	}

	.equity-label {
		font-size: var(--font-xs);
		color: rgba(255, 255, 255, 0.5);
		letter-spacing: 1.5px;
		text-transform: uppercase;
		margin-bottom: var(--spacing-xs);
	}

	.equity-value {
		font-size: 40px;
		font-weight: 800;
		color: var(--color-text-inverse);
		font-family: 'DIN Alternate', 'Roboto Mono', 'SF Mono', monospace;
		letter-spacing: -1px;
	}

	.account-stats {
		flex-direction: row;
		flex-wrap: wrap;
		padding-top: var(--spacing-lg);
		border-top-width: 1px;
		border-top-color: rgba(255, 255, 255, 0.08);
		border-top-style: solid;
	}

	.stat-item {
		width: 50%;
		margin-bottom: var(--spacing-md);
		padding-right: var(--spacing-md);
	}

	.stat-label {
		font-size: var(--font-xs);
		color: rgba(255, 255, 255, 0.45);
		letter-spacing: 0.5px;
		margin-bottom: 4px;
	}

	.stat-value {
		font-size: var(--font-md);
		color: rgba(255, 255, 255, 0.95);
		font-weight: 700;
		font-family: 'DIN Alternate', 'Roboto Mono', 'SF Mono', monospace;
	}

	.action-bar {
		flex-direction: row;
		padding: 0 var(--spacing-md);
		margin-bottom: var(--spacing-md);
		gap: var(--spacing-md);
	}

	.action-btn {
		flex: 1;
		height: 48px;
		border-radius: var(--radius-lg);
		flex-direction: row;
		justify-content: center;
		align-items: center;
		box-shadow: var(--shadow-btn);
		transition: all var(--transition-fast);
	}

	.action-btn:active {
		opacity: 0.85;
		transform: translateY(1px);
	}

	.action-btn-icon {
		width: 18px;
		height: 18px;
		margin-right: 6px;
	}

	.action-btn-primary {
		background: var(--gradient-primary);
		box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
	}

	.action-btn-danger {
		background: var(--gradient-danger);
		box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);
	}

	.action-btn-text-light {
		color: var(--color-text-inverse);
		font-size: var(--font-sm);
		font-weight: 700;
		letter-spacing: 1px;
	}

	.tab-bar {
		flex-direction: row;
		background-color: var(--color-bg-card);
		margin: 0 var(--spacing-md);
		border-radius: var(--radius-pill);
		padding: 4px;
		box-shadow: var(--shadow-sm);
	}

	.tab-item {
		flex: 1;
		height: 40px;
		justify-content: center;
		align-items: center;
		border-radius: var(--radius-pill);
		transition: all var(--transition-fast);
	}

	.tab-item-active {
		background-color: var(--color-primary);
		box-shadow: 0 2px 8px rgba(37, 99, 235, 0.25);
	}

	.tab-text {
		font-size: var(--font-sm);
		color: var(--color-text-secondary);
		font-weight: 600;
		letter-spacing: 0.5px;
	}

	.tab-text-active {
		color: var(--color-text-inverse);
	}

	.content-scroll {
		flex: 1;
		padding-top: var(--spacing-sm);
	}

	.order-card {
		margin: var(--spacing-sm) var(--spacing-md);
		padding: var(--spacing-lg);
		background-color: var(--color-bg-card);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-card);
		position: relative;
		overflow: hidden;
	}

	.order-card::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 4px;
		background-color: var(--color-border-light);
	}

	.order-card:has(.badge-buy)::before {
		background-color: var(--color-success);
	}

	.order-card:has(.badge-sell)::before {
		background-color: var(--color-danger);
	}

	.order-header {
		flex-direction: row;
		align-items: center;
		margin-bottom: var(--spacing-md);
	}

	.order-symbol {
		font-size: var(--font-lg);
		font-weight: 800;
		color: var(--color-text-primary);
		margin-right: var(--spacing-sm);
		letter-spacing: 0.5px;
	}

	.direction-badge {
		padding: 4px var(--spacing-md);
		border-radius: var(--radius-pill);
		margin-right: var(--spacing-sm);
	}

	.badge-buy {
		background-color: var(--color-success-bg);
	}

	.badge-sell {
		background-color: var(--color-danger-bg);
	}

	.direction-text {
		font-size: var(--font-xs);
		font-weight: 600;
	}

	.badge-buy .direction-text {
		color: var(--color-success);
	}

	.badge-sell .direction-text {
		color: var(--color-danger);
	}

	.order-lots {
		font-size: var(--font-sm);
		color: var(--color-text-muted);
		font-weight: 500;
		margin-left: auto;
	}

	.order-status {
		font-size: var(--font-xs);
		color: var(--color-text-muted);
		font-weight: 500;
		margin-left: auto;
	}

	.order-body {
		flex-direction: row;
		margin-bottom: var(--spacing-md);
		padding: var(--spacing-sm) 0;
		border-top-width: 1px;
		border-top-color: var(--color-divider);
		border-top-style: solid;
		border-bottom-width: 1px;
		border-bottom-color: var(--color-divider);
		border-bottom-style: solid;
	}

	.order-col {
		flex: 1;
	}

	.col-label {
		font-size: var(--font-xs);
		color: var(--color-text-muted);
		letter-spacing: 0.3px;
	}

	.col-value {
		font-size: var(--font-sm);
		color: var(--color-text-primary);
		margin-top: 3px;
		font-weight: 600;
	}

	.order-footer {
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
	}

	.order-time {
		font-size: var(--font-xs);
		color: var(--color-text-muted);
	}

	.close-btn {
		padding: var(--spacing-xs) var(--spacing-lg);
		border-radius: var(--radius-sm);
		background: var(--gradient-danger);
		box-shadow: var(--shadow-sm);
		transition: opacity var(--transition-fast);
	}

	.close-btn-text {
		font-size: var(--font-xs);
		color: var(--color-text-inverse);
		font-weight: 600;
	}

	.close-type-text {
		font-size: var(--font-xs);
		color: var(--color-text-muted);
		font-weight: 500;
	}

	.text-green {
		color: var(--color-success);
	}

	.text-red {
		color: var(--color-danger);
	}

	.empty-view {
		padding: 100px 0;
		justify-content: center;
		align-items: center;
	}

	.empty-icon {
		width: 120px;
		height: 120px;
		margin-bottom: var(--spacing-lg);
		opacity: 0.8;
	}

	.empty-text {
		font-size: var(--font-md);
		color: var(--color-text-muted);
		letter-spacing: 1px;
		font-weight: 500;
	}
</style>
