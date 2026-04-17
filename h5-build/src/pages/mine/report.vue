<template>
	<view class="report-page">
		<CustomNavBar title="交易报表" />
		<view class="tab-bar">
			<view v-for="(tab, idx) in tabs" :key="idx" class="tab-item"
				:class="{'tab-active': activeTab == idx}" @click="switchTab(idx)">
				<text class="tab-text" :class="{'tab-text-active': activeTab == idx}">{{tab}}</text>
			</view>
		</view>

		<view class="account-switch-row">
			<text class="switch-label">{{accountType == 'demo' ? '模拟盘' : '实盘'}}</text>
			<view class="switch-btn" @click="switchAccount">
				<text class="switch-btn-text">切换</text>
			</view>
		</view>

		<scroll-view class="report-scroll" direction="vertical">
			<!-- 交易报表 -->
			<view v-if="activeTab == 0" class="report-content">
				<view class="stats-grid">
					<view class="stats-item">
						<text class="stats-value">{{tradeReport.totalOrders}}</text>
						<text class="stats-label">总订单数</text>
					</view>
					<view class="stats-item">
						<text class="stats-value">{{tradeReport.totalLots}}</text>
						<text class="stats-label">总手数</text>
					</view>
					<view class="stats-item">
						<text class="stats-value">{{tradeReport.winRate}}%</text>
						<text class="stats-label">胜率</text>
					</view>
					<view class="stats-item">
						<text class="stats-value" :class="tradeReport.totalPnl >= 0 ? 'text-green' : 'text-red'">
							${{formatMoney(tradeReport.totalPnl)}}
						</text>
						<text class="stats-label">总盈亏</text>
					</view>
				</view>
				<view class="trend-section">
					<text class="section-title">每日交易趋势</text>
					<view v-for="(d, idx) in tradeReport.dailyTrend" :key="idx" class="trend-row">
						<text class="trend-date">{{d.date}}</text>
						<text class="trend-val">{{d.orders}}单 {{d.lots}}手</text>
						<text class="trend-pnl" :class="d.pnl >= 0 ? 'text-green' : 'text-red'">
							{{d.pnl >= 0 ? '+' : ''}}${{formatMoney(d.pnl)}}
						</text>
					</view>
					<view v-if="tradeReport.dailyTrend.length == 0" class="empty-hint">
						<text class="empty-text">暂无数据</text>
					</view>
				</view>
			</view>

			<!-- 盈亏报表 -->
			<view v-if="activeTab == 1" class="report-content">
				<view class="stats-grid">
					<view class="stats-item">
						<text class="stats-value" :class="pnlReport.totalPnl >= 0 ? 'text-green' : 'text-red'">
							${{formatMoney(pnlReport.totalPnl)}}
						</text>
						<text class="stats-label">总盈亏</text>
					</view>
					<view class="stats-item">
						<text class="stats-value text-green">${{formatMoney(pnlReport.totalProfit)}}</text>
						<text class="stats-label">总盈利</text>
					</view>
					<view class="stats-item">
						<text class="stats-value text-red">${{formatMoney(pnlReport.totalLoss)}}</text>
						<text class="stats-label">总亏损</text>
					</view>
					<view class="stats-item">
						<text class="stats-value">${{formatMoney(pnlReport.avgPnl)}}</text>
						<text class="stats-label">平均盈亏</text>
					</view>
				</view>
				<view class="trend-section">
					<text class="section-title">按品种统计</text>
					<view v-for="(s, idx) in pnlReport.bySymbol" :key="idx" class="trend-row">
						<text class="trend-date">{{s.symbol}}</text>
						<text class="trend-val">{{s.orders}}单</text>
						<text class="trend-pnl" :class="s.pnl >= 0 ? 'text-green' : 'text-red'">
							{{s.pnl >= 0 ? '+' : ''}}${{formatMoney(s.pnl)}}
						</text>
					</view>
					<view v-if="pnlReport.bySymbol.length == 0" class="empty-hint">
						<text class="empty-text">暂无数据</text>
					</view>
				</view>
			</view>

			<!-- 费用报表 -->
			<view v-if="activeTab == 2" class="report-content">
				<view class="stats-grid" v-if="false">
					<view class="stats-item">
						<text class="stats-value">${{formatMoney(feesReport.totalFees)}}</text>
						<text class="stats-label">总费用</text>
					</view>
					<view class="stats-item">
						<text class="stats-value">${{formatMoney(feesReport.totalSpread)}}</text>
						<text class="stats-label">点差</text>
					</view>
					<view class="stats-item">
						<text class="stats-value">${{formatMoney(feesReport.totalCommission)}}</text>
						<text class="stats-label">手续费</text>
					</view>
					<view class="stats-item">
						<text class="stats-value">${{formatMoney(feesReport.totalSwap)}}</text>
						<text class="stats-label">隔夜费</text>
					</view>
				</view>
				<view class="trend-section" v-if="false">
					<text class="section-title">每日费用统计</text>
					<view v-for="(d, idx) in feesReport.daily" :key="idx" class="trend-row">
						<text class="trend-date">{{d.date}}</text>
						<text class="trend-val">${{formatMoney(d.total)}}</text>
					</view>
					<view v-if="feesReport.daily.length == 0" class="empty-hint">
						<text class="empty-text">暂无数据</text>
					</view>
				</view>
			</view>
		</scroll-view>
	</view>
</template>

<script setup lang="ts">
	import CustomNavBar from '@/components/CustomNavBar.vue'
	import { ref, reactive } from 'vue'
	import { onLoad } from '@dcloudio/uni-app'
	import { get } from '@/utils/request.uts'

	type DailyTrend = { date : string; orders : number; lots : number; pnl : number }
	type SymbolPnl = { symbol : string; orders : number; pnl : number; lots : number }
	type DailyFee = { date : string; total : number }

	type TradeReport = {
		totalOrders : number; totalLots : number; winRate : number; totalPnl : number;
		dailyTrend : DailyTrend[]
	}
	type PnlReport = {
		totalPnl : number; totalProfit : number; totalLoss : number; avgPnl : number;
		bySymbol : SymbolPnl[]
	}
	type FeesReport = {
		totalFees : number; totalSpread : number; totalCommission : number; totalSwap : number;
		daily : DailyFee[]
	}

	const tabs = ['交易报表', '盈亏报表']
	const activeTab = ref(0)
	const savedAccType = uni.getStorageSync('preferredAccountType') as string
	const accountType = ref(savedAccType.length > 0 ? savedAccType : 'real')

	const tradeReport = reactive({
		totalOrders: 0, totalLots: 0, winRate: 0, totalPnl: 0, dailyTrend: [] as DailyTrend[]
	} as TradeReport)
	const pnlReport = reactive({
		totalPnl: 0, totalProfit: 0, totalLoss: 0, avgPnl: 0, bySymbol: [] as SymbolPnl[]
	} as PnlReport)
	const feesReport = reactive({
		totalFees: 0, totalSpread: 0, totalCommission: 0, totalSwap: 0, daily: [] as DailyFee[]
	} as FeesReport)

	function formatMoney(val : number) : string { return val.toFixed(2) }

	function switchTab(idx : number) {
		activeTab.value = idx
		loadReport()
	}

	function switchAccount() {
		accountType.value = accountType.value == 'demo' ? 'real' : 'demo'
		loadReport()
	}

	function loadReport() {
		const at = accountType.value
		if (activeTab.value == 0) {
			get(`/api/mobile/report/trade?accountType=${at}`).then((res) => {
				if (res.code == 200 && res.data != null) {
					const d = res.data as any
					tradeReport.totalOrders = (d['totalOrders'] as number) ?? 0
					tradeReport.totalLots = (d['totalLots'] as number) ?? 0
					tradeReport.winRate = (d['winRate'] as number) ?? 0
					tradeReport.totalPnl = (d['totalPnl'] as number) ?? 0
					const trend = d['dailyTrend'] as any[]
					tradeReport.dailyTrend = trend.map((t : any) : DailyTrend => {
						return {
							date: (t['date'] as string) ?? '',
							orders: (t['orders'] as number) ?? 0,
							lots: (t['lots'] as number) ?? 0,
							pnl: (t['pnl'] as number) ?? 0,
						} as DailyTrend
					})
				}
			})
		} else if (activeTab.value == 1) {
			get(`/api/mobile/report/pnl?accountType=${at}`).then((res) => {
				if (res.code == 200 && res.data != null) {
					const d = res.data as any
					pnlReport.totalPnl = (d['totalPnl'] as number) ?? 0
					pnlReport.totalProfit = (d['totalProfit'] as number) ?? 0
					pnlReport.totalLoss = (d['totalLoss'] as number) ?? 0
					pnlReport.avgPnl = (d['avgPnl'] as number) ?? 0
					const bs = d['bySymbol'] as any[]
					pnlReport.bySymbol = bs.map((s : any) : SymbolPnl => {
						return {
							symbol: (s['symbol'] as string) ?? '',
							orders: (s['orders'] as number) ?? 0,
							pnl: (s['pnl'] as number) ?? 0,
							lots: (s['lots'] as number) ?? 0,
						} as SymbolPnl
					})
				}
			})
		} else {
			get(`/api/mobile/report/fees?accountType=${at}`).then((res) => {
				if (res.code == 200 && res.data != null) {
					const d = res.data as any
					feesReport.totalFees = (d['totalFees'] as number) ?? 0
					feesReport.totalSpread = (d['totalSpread'] as number) ?? 0
					feesReport.totalCommission = (d['totalCommission'] as number) ?? 0
					feesReport.totalSwap = (d['totalSwap'] as number) ?? 0
					const dl = d['daily'] as any[]
					feesReport.daily = dl.map((f : any) : DailyFee => {
						return {
							date: (f['date'] as string) ?? '',
							total: (f['total'] as number) ?? 0,
						} as DailyFee
					})
				}
			})
		}
	}

	onLoad(() => { loadReport() })
</script>

<style>
	.report-page {
		flex: 1;
		background-color: var(--color-bg-page);
	}

	.tab-bar {
		flex-direction: row;
		background-color: var(--color-bg-card);
		padding: 0 var(--spacing-sm);
	}

	.tab-item {
		flex: 1;
		padding: var(--spacing-lg) 0;
		align-items: center;
		border-bottom-width: 2px;
		border-bottom-style: solid;
		border-bottom-color: transparent;
	}

	.tab-active {
		border-bottom-color: var(--color-primary);
	}

	.tab-text {
		font-size: var(--font-sm);
		color: var(--color-text-secondary);
		font-weight: 500;
	}

	.tab-text-active {
		color: var(--color-primary);
		font-weight: 700;
	}

	.account-switch-row {
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		padding: var(--spacing-md) var(--spacing-lg);
		background-color: var(--color-bg-card);
		border-top-width: 1px;
		border-top-style: solid;
		border-top-color: var(--color-divider);
	}

	.switch-label {
		font-size: var(--font-sm);
		color: var(--color-text-primary);
		font-weight: 500;
	}

	.switch-btn {
		padding: var(--spacing-xs) var(--spacing-md);
		background-color: var(--color-primary-bg);
		border-radius: var(--radius-pill);
		border-width: 1px;
		border-style: solid;
		border-color: var(--color-primary);
	}

	.switch-btn-text {
		font-size: var(--font-xs);
		color: var(--color-primary);
		font-weight: 600;
	}

	.report-scroll {
		flex: 1;
		padding: var(--spacing-lg);
	}

	.report-content { }

	.stats-grid {
		flex-direction: row;
		flex-wrap: wrap;
		background-color: var(--color-bg-card);
		border-radius: var(--radius-lg);
		padding: var(--spacing-lg);
		margin-bottom: var(--spacing-lg);
		box-shadow: var(--shadow-card);
	}

	.stats-item {
		width: 50%;
		align-items: center;
		padding: var(--spacing-md) 0;
	}

	.stats-value {
		font-size: var(--font-2xl);
		font-weight: 700;
		color: var(--color-text-primary);
		margin-bottom: var(--spacing-xs);
	}

	.stats-label {
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

	.trend-section {
		background-color: var(--color-bg-card);
		border-radius: var(--radius-lg);
		padding: var(--spacing-xl);
		box-shadow: var(--shadow-card);
	}

	.section-title {
		font-size: var(--font-md);
		font-weight: 700;
		color: var(--color-text-primary);
		margin-bottom: var(--spacing-lg);
	}

	.trend-row {
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		padding: var(--spacing-md) 0;
		border-bottom-width: 1px;
		border-bottom-style: solid;
		border-bottom-color: var(--color-divider);
	}

	.trend-date {
		font-size: var(--font-sm);
		color: var(--color-text-secondary);
		flex: 1;
	}

	.trend-val {
		font-size: var(--font-sm);
		color: var(--color-text-muted);
		margin-right: var(--spacing-lg);
	}

	.trend-pnl {
		font-size: var(--font-sm);
		font-weight: 700;
	}

	.empty-hint {
		padding: var(--spacing-3xl) 0;
		align-items: center;
	}

	.empty-text {
		font-size: var(--font-sm);
		color: var(--color-text-muted);
	}
</style>
