<template>
	<view class="detail-page">
		<CustomNavBar title="订单详情" />
		<scroll-view class="detail-scroll" direction="vertical" v-if="order != null">
			<view class="status-card"
				:class="(order!['status'] as string) == 'open' ? 'status-open' : 'status-closed'">
				<view class="status-header">
					<text class="status-symbol">{{order!['symbol'] as string}}</text>
					<text class="status-name">{{order!['symbol_name'] as string}}</text>
				</view>
				<view class="status-main">
					<view class="direction-badge-lg"
						:class="(order!['direction'] as string) == 'buy' ? 'badge-buy' : 'badge-sell'">
						<text class="direction-text-lg">
							{{(order!['direction'] as string) == 'buy' ? '买入' : '卖出'}}
						</text>
					</view>
					<text class="status-lots">{{order!['lots']}}手</text>
					<text class="status-leverage">{{order!['leverage']}}x</text>
				</view>
				<view class="pnl-display" v-if="(order!['status'] as string) == 'closed'">
					<text class="pnl-label">净盈亏</text>
					<text class="pnl-value"
						:class="parseFloat((order!['net_pnl'] ?? '0') + '') >= 0 ? 'text-green' : 'text-red'">
						${{formatMoney(parseFloat((order!['net_pnl'] ?? '0') + ''))}}
					</text>
				</view>
				<view class="pnl-display" v-else>
					<text class="pnl-label">浮动盈亏</text>
					<text class="pnl-value"
						:class="parseFloat((order!['floating_pnl'] ?? '0') + '') >= 0 ? 'text-green' : 'text-red'">
						${{formatMoney(parseFloat((order!['floating_pnl'] ?? '0') + ''))}}
					</text>
				</view>
			</view>

			<view class="info-section">
				<text class="info-title">订单信息</text>
				<view class="info-row">
					<text class="info-label">订单号</text>
					<text class="info-val">{{order!['order_no'] as string}}</text>
				</view>
				<view class="info-row">
					<text class="info-label">状态</text>
					<text class="info-val">{{getStatusText(order!['status'] as string)}}</text>
				</view>
				<view class="info-row" v-if="order!['pending_type'] != null">
					<text class="info-label">挂单类型</text>
					<text class="info-val">{{getPendingTypeText(order!['pending_type'] as string)}}</text>
				</view>
				<view class="info-row">
					<text class="info-label">{{order!['record_type'] == 'pending' ? '目标价' : '开仓价'}}</text>
					<text class="info-val">{{order!['open_price']}}</text>
				</view>
				<view class="info-row" v-if="(order!['status'] as string) == 'open' && order!['currentPrice'] != null">
					<text class="info-label">当前价</text>
					<text class="info-val">{{order!['currentPrice']}}</text>
				</view>
				<view class="info-row" v-if="order!['close_price'] != null">
					<text class="info-label">平仓价</text>
					<text class="info-val">{{order!['close_price']}}</text>
				</view>
				<view class="info-row">
					<text class="info-label">止损价</text>
					<text class="info-val">{{order!['stop_loss'] ?? '未设置'}}</text>
				</view>
				<view class="info-row">
					<text class="info-label">止盈价</text>
					<text class="info-val">{{order!['take_profit'] ?? '未设置'}}</text>
				</view>
				<view class="info-row" v-if="order!['trailing_stop'] != null">
					<text class="info-label">移动止损</text>
					<text class="info-val">{{order!['trailing_stop']}} 点</text>
				</view>
			</view>

			<view class="info-section">
				<text class="info-title">费用明细</text>
				<view class="info-row">
					<text class="info-label">保证金</text>
					<text class="info-val">${{formatMoney(parseFloat((order!['margin'] ?? '0') + ''))}}</text>
				</view>
				<view class="info-row" v-if="false">
					<text class="info-label">开仓手续费</text>
					<text class="info-val">${{formatMoney(parseFloat((order!['commission'] ?? '0') + ''))}}</text>
				</view>
				<view class="info-row" v-if="false">
					<text class="info-label">平仓手续费</text>
					<text class="info-val">${{formatMoney(parseFloat((order!['commission_close'] ?? '0') + ''))}}</text>
				</view>
				<view class="info-row" v-if="false">
					<text class="info-label">点差成本</text>
					<text class="info-val">${{formatMoney(parseFloat((order!['spread_cost'] ?? '0') + ''))}}</text>
				</view>
				<view class="info-row" v-if="false">
					<text class="info-label">累计隔夜费</text>
					<text class="info-val">${{formatMoney(parseFloat((order!['swap_total'] ?? '0') + ''))}}</text>
				</view>
				<view class="info-row" v-if="(order!['status'] as string) == 'closed'">
					<text class="info-label">已实现盈亏</text>
					<text class="info-val"
						:class="parseFloat((order!['realized_pnl'] ?? '0') + '') >= 0 ? 'text-green' : 'text-red'">
						${{formatMoney(parseFloat((order!['realized_pnl'] ?? '0') + ''))}}
					</text>
				</view>
			</view>

			<view class="info-section">
				<text class="info-title">时间信息</text>
				<view class="info-row">
					<text class="info-label">开仓时间</text>
					<text class="info-val">{{formatTime(order!['opened_at'])}}</text>
				</view>
				<view class="info-row" v-if="order!['closed_at'] != null">
					<text class="info-label">平仓时间</text>
					<text class="info-val">{{formatTime(order!['closed_at'])}}</text>
				</view>
				<view class="info-row" v-if="order!['close_type'] != null">
					<text class="info-label">平仓方式</text>
					<text class="info-val">{{getCloseTypeText(order!['close_type'] as string)}}</text>
				</view>
			</view>

			<view class="info-section" v-if="flows.length > 0">
				<text class="info-title">交易流水</text>
				<view v-for="(flow, idx) in flows" :key="idx" class="flow-item" v-show="(flow['flow_type'] as string) != 'commission' && (flow['flow_type'] as string) != 'swap' && (flow['flow_type'] as string) != 'spread'">
					<view class="flow-left">
						<text class="flow-type">{{getFlowTypeText(flow['flow_type'] as string)}}</text>
						<text class="flow-time">{{formatTime(flow['created_at'])}}</text>
					</view>
					<text class="flow-amount"
						:class="parseFloat((flow['amount'] ?? '0') + '') >= 0 ? 'text-green' : 'text-red'">
						{{parseFloat((flow['amount'] ?? '0') + '') >= 0 ? '+' : ''}}${{formatMoney(parseFloat((flow['amount'] ?? '0') + ''))}}
					</text>
				</view>
			</view>

			<view class="bottom-actions" v-if="(order!['status'] as string) == 'open'">
				<view class="action-row">
					<view class="bottom-btn bottom-btn-outline" @click="openEditSltp">
						<text class="bottom-btn-text-outline">修改止损止盈</text>
					</view>
					<view class="bottom-btn bottom-btn-danger" @click="closeThisOrder">
						<text class="bottom-btn-text-light">平仓</text>
					</view>
				</view>
			</view>

			<view style="height: 30px;"></view>
		</scroll-view>

		<view class="sltp-modal-mask" v-if="showEditSltp" @click="showEditSltp = false">
			<view class="sltp-modal" @click.stop="">
				<view class="sltp-header">
					<text class="sltp-title">修改止损止盈</text>
					<text class="sltp-close" @click="showEditSltp = false">✕</text>
				</view>
				<view class="sltp-body">
					<view class="sltp-row">
						<text class="sltp-label">止损价</text>
						<input class="sltp-input" type="digit" placeholder="留空取消止损" :value="editStopLoss"
							@input="(e : InputEvent) => { editStopLoss = e.detail.value }" />
					</view>
					<view class="sltp-row">
						<text class="sltp-label">止盈价</text>
						<input class="sltp-input" type="digit" placeholder="留空取消止盈" :value="editTakeProfit"
							@input="(e : InputEvent) => { editTakeProfit = e.detail.value }" />
					</view>
					<view class="sltp-row">
						<text class="sltp-label">移动止损(点数)</text>
						<input class="sltp-input" type="digit" placeholder="留空取消移动止损" :value="editTrailingStop"
							@input="(e : InputEvent) => { editTrailingStop = e.detail.value }" />
					</view>
					<view class="sltp-hint">
						<text class="sltp-hint-text">买入订单：止损价须低于开仓价，止盈价须高于开仓价</text>
						<text class="sltp-hint-text">卖出订单：止损价须高于开仓价，止盈价须低于开仓价</text>
					</view>
				</view>
				<view class="sltp-footer">
					<view class="sltp-btn sltp-btn-cancel" @click="showEditSltp = false">
						<text class="sltp-btn-text-cancel">取消</text>
					</view>
					<view class="sltp-btn sltp-btn-confirm" @click="submitSltp">
						<text class="sltp-btn-text-confirm">确定修改</text>
					</view>
				</view>
			</view>
		</view>

		<view v-if="order == null" class="loading-view">
			<text class="loading-text">加载中...</text>
		</view>
	</view>
</template>

<script setup lang="ts">
	import CustomNavBar from '@/components/CustomNavBar.vue'
	import { ref } from 'vue'
	import { onLoad, onShow, onHide } from '@dcloudio/uni-app'
	import { get, post, put } from '@/utils/request.uts'
	import { toBeijingTime } from '@/utils/timeUtils'

	const order = ref<any | null>(null)
	const flows = ref<any[]>([])
	const showEditSltp = ref(false)
	const editStopLoss = ref('')
	const editTakeProfit = ref('')
	const editTrailingStop = ref('')
	let orderId = 0
	let recordType = ''
	let refreshTimer = 0

	onLoad((options : OnLoadOptions) => {
		if (options['id'] != null) {
			orderId = parseInt(options['id']!)
			recordType = (options['record_type'] ?? '') as string
			loadOrder()
		}
	})

	onShow(() => {
		if (orderId > 0) {
			refreshTimer = setInterval(() => {
				if (order.value != null && (order.value!['status'] as string) == 'open') {
					loadOrder()
				}
			}, 3000) as number
		}
	})

	onHide(() => {
		if (refreshTimer > 0) {
			clearInterval(refreshTimer)
			refreshTimer = 0
		}
	})

	function loadOrder() {
		const rtParam = recordType.length > 0 ? `?record_type=${recordType}` : ''
		get(`/api/mobile/trade/orders/${orderId}${rtParam}`).then((res) => {
			if (res.code == 200 && res.data != null) {
				const d = res.data as any
				order.value = d
				const f = d['flows']
				if (f != null) {
					const fArr = JSON.parse<any[]>(JSON.stringify(f))
					if (fArr != null) flows.value = fArr!
				}
			}
		}).catch((_e : any) => { })
	}

	function openEditSltp() {
		if (order.value == null) return
		const o = order.value!
		editStopLoss.value = o['stop_loss'] != null ? (o['stop_loss'] as number).toString() : ''
		editTakeProfit.value = o['take_profit'] != null ? (o['take_profit'] as number).toString() : ''
		editTrailingStop.value = o['trailing_stop'] != null ? (o['trailing_stop'] as number).toString() : ''
		showEditSltp.value = true
	}

	function submitSltp() {
		const data = {} as any
		data['stopLoss'] = editStopLoss.value.length > 0 ? parseFloat(editStopLoss.value) : null
		data['takeProfit'] = editTakeProfit.value.length > 0 ? parseFloat(editTakeProfit.value) : null
		data['trailingStop'] = editTrailingStop.value.length > 0 ? parseFloat(editTrailingStop.value) : null

		put(`/api/mobile/trade/order/${orderId}/sltp`, data).then((res) => {
			if (res.code == 200) {
				uni.showToast({ title: '修改成功', icon: 'success' })
				showEditSltp.value = false
				loadOrder()
			} else {
				uni.showToast({ title: res.msg, icon: 'none' })
			}
		}).catch((_e : any) => {
			uni.showToast({ title: '修改失败', icon: 'none' })
		})
	}

	function closeThisOrder() {
		uni.showModal({
			title: '确认平仓',
			content: '确定要平仓该订单吗？',
			success: (modalRes) => {
				if (modalRes.confirm) {
					post(`/api/mobile/trade/close/${orderId}`, {}).then((res) => {
						if (res.code == 200) {
							uni.showToast({ title: '平仓成功', icon: 'success' })
							loadOrder()
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

	function formatMoney(val : number) : string {
		return val.toFixed(2)
	}

	function formatTime(t : any) : string {
		if (t == null) return '-'
		return toBeijingTime(t as string)
	}

	function getStatusText(s : string) : string {
		if (s == 'open') return '持仓中'
		if (s == 'closed') return '已平仓'
		if (s == 'cancelled') return recordType == 'pending' ? '挂单已撤销' : '已取消'
		if (s == 'expired') return '挂单已过期'
		return s
	}

	function getCloseTypeText(t : string) : string {
		if (t == 'manual') return '手动平仓'
		if (t == 'stop_loss') return '止损平仓'
		if (t == 'take_profit') return '止盈平仓'
		if (t == 'admin') return '管理员平仓'
		if (t == 'trailing_stop') return '移动止损'
		if (t == 'force_close') return '强制平仓'
		return t
	}

	function getPendingTypeText(t : string) : string {
		if (t == 'buy_limit') return '买入限价'
		if (t == 'buy_stop') return '买入止损'
		if (t == 'sell_limit') return '卖出限价'
		if (t == 'sell_stop') return '卖出止损'
		return t
	}

	function getFlowTypeText(t : string) : string {
		if (t == 'open') return '开仓'
		if (t == 'close') return '平仓'
		if (t == 'commission') return '手续费'
		if (t == 'swap') return '隔夜费'
		return t
	}
</script>

<style>
	.detail-page {
		flex: 1;
		background-color: var(--color-bg-page);
	}

	.detail-scroll {
		flex: 1;
	}

	.status-card {
		padding: var(--spacing-xl) var(--spacing-lg);
		margin: var(--spacing-md);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-lg);
	}

	.status-open {
		background: var(--gradient-primary);
	}

	.status-closed {
		background: var(--gradient-dark);
	}

	.status-header {
		flex-direction: row;
		align-items: center;
		margin-bottom: var(--spacing-md);
	}

	.status-symbol {
		font-size: var(--font-2xl);
		font-weight: 700;
		color: var(--color-text-inverse);
		margin-right: var(--spacing-sm);
		letter-spacing: -0.3px;
	}

	.status-name {
		font-size: var(--font-sm);
		color: rgba(255, 255, 255, 0.7);
		font-weight: 500;
	}

	.status-main {
		flex-direction: row;
		align-items: center;
		margin-bottom: var(--spacing-lg);
	}

	.direction-badge-lg {
		padding: var(--spacing-xs) var(--spacing-md);
		border-radius: var(--radius-sm);
		margin-right: var(--spacing-md);
	}

	.badge-buy {
		background-color: rgba(16, 185, 129, 0.25);
		border-width: 1px;
		border-color: rgba(16, 185, 129, 0.4);
		border-style: solid;
	}

	.badge-sell {
		background-color: rgba(239, 68, 68, 0.25);
		border-width: 1px;
		border-color: rgba(239, 68, 68, 0.4);
		border-style: solid;
	}

	.direction-text-lg {
		font-size: var(--font-sm);
		font-weight: 700;
		color: var(--color-text-inverse);
	}

	.status-lots {
		font-size: var(--font-sm);
		color: rgba(255, 255, 255, 0.85);
		margin-right: var(--spacing-md);
		font-weight: 600;
	}

	.status-leverage {
		font-size: var(--font-sm);
		color: rgba(255, 255, 255, 0.55);
		font-weight: 500;
	}

	.pnl-display {
		align-items: center;
		padding-top: var(--spacing-md);
		border-top-width: 1px;
		border-top-color: rgba(255, 255, 255, 0.12);
		border-top-style: solid;
	}

	.pnl-label {
		font-size: var(--font-xs);
		color: rgba(255, 255, 255, 0.55);
		letter-spacing: 1px;
		text-transform: uppercase;
	}

	.pnl-value {
		font-size: var(--font-5xl);
		font-weight: 700;
		margin-top: var(--spacing-xs);
		letter-spacing: -0.5px;
	}

	.info-section {
		margin: var(--spacing-sm) var(--spacing-md);
		padding: var(--spacing-md);
		background-color: var(--color-bg-card);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-card);
	}

	.info-title {
		font-size: var(--font-sm);
		font-weight: 700;
		color: var(--color-text-primary);
		margin-bottom: var(--spacing-sm);
		padding-bottom: var(--spacing-sm);
		border-bottom-width: 2px;
		border-bottom-color: var(--color-primary);
		border-bottom-style: solid;
		letter-spacing: 0.3px;
	}

	.info-row {
		flex-direction: row;
		justify-content: space-between;
		padding: var(--spacing-sm) var(--spacing-xs);
		border-bottom-width: 0;
		border-bottom-style: none;
	}

	.info-row:nth-child(even) {
		background-color: var(--color-bg-section);
		border-radius: var(--radius-sm);
	}

	.info-label {
		font-size: var(--font-sm);
		color: var(--color-text-muted);
		font-weight: 500;
	}

	.info-val {
		font-size: var(--font-sm);
		color: var(--color-text-primary);
		font-weight: 600;
	}

	.flow-item {
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		padding: var(--spacing-sm) var(--spacing-xs);
		border-bottom-width: 1px;
		border-bottom-color: var(--color-divider);
		border-bottom-style: solid;
	}

	.flow-left {
		flex: 1;
	}

	.flow-type {
		font-size: var(--font-sm);
		color: var(--color-text-primary);
		font-weight: 600;
	}

	.flow-time {
		font-size: var(--font-xs);
		color: var(--color-text-muted);
		margin-top: 3px;
	}

	.flow-amount {
		font-size: var(--font-sm);
		font-weight: 700;
	}

	.bottom-actions {
		padding: var(--spacing-lg) var(--spacing-md);
	}

	.action-row {
		flex-direction: row;
		gap: var(--spacing-sm);
	}

	.bottom-btn {
		flex: 1;
		height: 48px;
		border-radius: var(--radius-md);
		justify-content: center;
		align-items: center;
		margin: 0 var(--spacing-xs);
		transition: opacity var(--transition-fast);
	}

	.bottom-btn-outline {
		border-width: 1.5px;
		border-color: var(--color-primary);
		border-style: solid;
		background-color: var(--color-bg-card);
		box-shadow: var(--shadow-sm);
	}

	.bottom-btn-danger {
		background: var(--gradient-danger);
		box-shadow: var(--shadow-btn);
	}

	.bottom-btn-text-outline {
		font-size: var(--font-md);
		color: var(--color-primary);
		font-weight: 700;
	}

	.bottom-btn-text-light {
		font-size: var(--font-md);
		color: var(--color-text-inverse);
		font-weight: 700;
	}

	.text-green {
		color: var(--color-success);
	}

	.text-red {
		color: var(--color-danger);
	}

	.sltp-modal-mask {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(15, 23, 42, 0.6);
		justify-content: center;
		align-items: center;
	}

	.sltp-modal {
		width: 330px;
		background-color: var(--color-bg-card);
		border-radius: var(--radius-lg);
		overflow: hidden;
		box-shadow: var(--shadow-xl);
	}

	.sltp-header {
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		padding: var(--spacing-lg);
		border-bottom-width: 1px;
		border-bottom-color: var(--color-divider);
		border-bottom-style: solid;
	}

	.sltp-title {
		font-size: var(--font-lg);
		font-weight: 700;
		color: var(--color-text-primary);
	}

	.sltp-close {
		font-size: 18px;
		color: var(--color-text-muted);
		padding: var(--spacing-xs) var(--spacing-sm);
	}

	.sltp-body {
		padding: var(--spacing-lg);
	}

	.sltp-row {
		margin-bottom: var(--spacing-md);
	}

	.sltp-label {
		font-size: var(--font-sm);
		color: var(--color-text-secondary);
		margin-bottom: var(--spacing-sm);
		font-weight: 500;
	}

	.sltp-input {
		height: 42px;
		background-color: var(--color-bg-input);
		border-radius: var(--radius-sm);
		padding: 0 var(--spacing-md);
		font-size: var(--font-sm);
		color: var(--color-text-primary);
		border-width: 1px;
		border-color: var(--color-border);
		border-style: solid;
		transition: border-color var(--transition-fast);
	}

	.sltp-hint {
		margin-top: var(--spacing-sm);
		padding: var(--spacing-sm) var(--spacing-md);
		background-color: var(--color-warning-bg);
		border-radius: var(--radius-sm);
	}

	.sltp-hint-text {
		font-size: var(--font-xs);
		color: var(--color-text-secondary);
		line-height: 18px;
	}

	.sltp-footer {
		flex-direction: row;
		padding: var(--spacing-md);
		gap: var(--spacing-sm);
	}

	.sltp-btn {
		flex: 1;
		height: 44px;
		justify-content: center;
		align-items: center;
		border-radius: var(--radius-sm);
	}

	.sltp-btn-cancel {
		background-color: var(--color-bg-section);
	}

	.sltp-btn-text-cancel {
		font-size: var(--font-md);
		color: var(--color-text-secondary);
		font-weight: 600;
	}

	.sltp-btn-confirm {
		background: var(--gradient-primary);
		box-shadow: var(--shadow-btn);
	}

	.sltp-btn-text-confirm {
		font-size: var(--font-md);
		color: var(--color-text-inverse);
		font-weight: 700;
	}

	.loading-view {
		flex: 1;
		justify-content: center;
		align-items: center;
	}

	.loading-text {
		font-size: var(--font-sm);
		color: var(--color-text-muted);
	}
</style>
