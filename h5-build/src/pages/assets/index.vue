<template>
	<view class="assets-page">
		<view class="account-card">
			<view class="account-header">
				<text class="account-title">{{accountType == 'demo' ? '模拟账户' : '实盘账户'}}</text>
				<view class="account-switch" @click="switchAccountType">
					<text class="switch-text">切换</text>
				</view>
			</view>
			<view class="balance-section">
				<text class="balance-label">总资产(USD)</text>
				<text class="balance-value">${{formatMoney(accountInfo.equity)}}</text>
			</view>
			<view class="account-stats">
				<view class="stat-item">
					<text class="stat-label">可用余额</text>
					<text class="stat-value">${{formatMoney(accountInfo.availableMargin)}}</text>
				</view>
				<view class="stat-item">
					<text class="stat-label">冻结保证金</text>
					<text class="stat-value">${{formatMoney(accountInfo.frozenMargin)}}</text>
				</view>
				<view class="stat-item">
					<text class="stat-label">浮动盈亏</text>
					<text class="stat-value" :class="accountInfo.floatingPnl >= 0 ? 'text-green' : 'text-red'">
						{{accountInfo.floatingPnl >= 0 ? '+' : ''}}${{formatMoney(accountInfo.floatingPnl)}}
					</text>
				</view>
			</view>
		</view>

		<view class="action-row" v-if="accountType == 'real'">
			<view class="action-btn action-deposit" @click="goDeposit">
				<text class="action-icon">+</text>
				<text class="action-text">入金</text>
			</view>
			<view class="action-btn action-withdraw" @click="goWithdraw">
				<text class="action-icon">-</text>
				<text class="action-text">出金</text>
			</view>
		</view>

		<view class="menu-section">
			<text class="section-title">资金管理</text>
			<view class="menu-list">
				<view class="menu-item" @click="goPage('/pages/assets/deposit-records')">
					<text class="menu-label">入金记录</text>
					<image class="menu-arrow-icon" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='9 18 15 12 9 6'/%3E%3C/svg%3E" mode="aspectFit"></image>
				</view>
				<view class="menu-item" @click="goPage('/pages/assets/withdraw-records')">
					<text class="menu-label">出金记录</text>
					<image class="menu-arrow-icon" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='9 18 15 12 9 6'/%3E%3C/svg%3E" mode="aspectFit"></image>
				</view>
				<view class="menu-item" @click="goPage('/pages/assets/flows')">
					<text class="menu-label">资金流水</text>
					<image class="menu-arrow-icon" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='9 18 15 12 9 6'/%3E%3C/svg%3E" mode="aspectFit"></image>
				</view>
				<view class="menu-item" @click="goPage('/pages/assets/bank-card')">
					<text class="menu-label">收款账户</text>
					<image class="menu-arrow-icon" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='9 18 15 12 9 6'/%3E%3C/svg%3E" mode="aspectFit"></image>
				</view>
			</view>
		</view>

		<view class="summary-section">
			<text class="section-title">资金摘要</text>
			<view class="summary-grid">
				<view class="summary-item">
					<text class="summary-value">${{formatMoney(accountInfo.totalDeposit)}}</text>
					<text class="summary-label">累计入金</text>
				</view>
				<view class="summary-item">
					<text class="summary-value">${{formatMoney(accountInfo.totalWithdraw)}}</text>
					<text class="summary-label">累计出金</text>
				</view>
				<view class="summary-item">
					<text class="summary-value" :class="accountInfo.totalProfit >= 0 ? 'text-green' : 'text-red'">
						${{formatMoney(accountInfo.totalProfit)}}
					</text>
					<text class="summary-label">累计盈亏</text>
				</view>
				<view class="summary-item" v-if="false">
					<text class="summary-value">${{formatMoney(accountInfo.totalCommission + accountInfo.totalSwap)}}</text>
					<text class="summary-label">累计费用</text>
				</view>
			</view>
		</view>
		<FloatingTabBar :current="3" />
	</view>
</template>

<script setup lang="ts">
	import { ref, reactive } from 'vue'
	import { onShow } from '@dcloudio/uni-app'
	import { get } from '@/utils/request.uts'
	import FloatingTabBar from '../../components/FloatingTabBar.vue'

	type AccountData = {
		balance : number
		equity : number
		frozenMargin : number
		availableMargin : number
		floatingPnl : number
		totalDeposit : number
		totalWithdraw : number
		totalCommission : number
		totalSwap : number
		totalProfit : number
	}

	const savedAccType = uni.getStorageSync('preferredAccountType') as string
	const accountType = ref(savedAccType.length > 0 ? savedAccType : 'real')
	const accountInfo = reactive({
		balance: 0,
		equity: 0,
		frozenMargin: 0,
		availableMargin: 0,
		floatingPnl: 0,
		totalDeposit: 0,
		totalWithdraw: 0,
		totalCommission: 0,
		totalSwap: 0,
		totalProfit: 0,
	} as AccountData)

	function formatMoney(val : number) : string {
		return val.toFixed(2)
	}

	function switchAccountType() {
		accountType.value = accountType.value == 'real' ? 'demo' : 'real'
		uni.setStorageSync('preferredAccountType', accountType.value)
		loadAccount()
	}

	function loadAccount() {
		get(`/api/mobile/fund/account?accountType=${accountType.value}`).then((res) => {
			if (res.code == 200 && res.data != null) {
				const d = res.data as any
				accountInfo.balance = (d['balance'] as number) ?? 0
				accountInfo.equity = (d['equity'] as number) ?? 0
				accountInfo.frozenMargin = (d['frozenMargin'] as number) ?? 0
				accountInfo.availableMargin = (d['availableMargin'] as number) ?? 0
				accountInfo.floatingPnl = (d['floatingPnl'] as number) ?? 0
				accountInfo.totalDeposit = (d['totalDeposit'] as number) ?? 0
				accountInfo.totalWithdraw = (d['totalWithdraw'] as number) ?? 0
				accountInfo.totalCommission = (d['totalCommission'] as number) ?? 0
				accountInfo.totalSwap = (d['totalSwap'] as number) ?? 0
				accountInfo.totalProfit = (d['totalProfit'] as number) ?? 0
			}
		})
	}

	function goDeposit() {
		uni.navigateTo({ url: '/pages/assets/deposit' })
	}

	function goWithdraw() {
		uni.navigateTo({ url: '/pages/assets/withdraw' })
	}

	function goPage(url : string) {
		uni.navigateTo({ url: url })
	}

	onShow(() => {
		loadAccount()
	})
</script>

<style>
	.assets-page {
		flex: 1;
		background-color: var(--color-bg-page);
	}

	.account-card {
		margin: var(--spacing-lg);
		padding: var(--spacing-xl) var(--spacing-xl) var(--spacing-lg);
		background: var(--gradient-primary);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-lg);
	}

	.account-header {
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--spacing-lg);
	}

	.account-title {
		font-size: var(--font-md);
		color: rgba(255, 255, 255, 0.92);
		font-weight: 600;
		letter-spacing: 0.5px;
	}

	.account-switch {
		padding: var(--spacing-xs) var(--spacing-md);
		background-color: rgba(255, 255, 255, 0.18);
		border-radius: var(--radius-pill);
		border-width: 1px;
		border-style: solid;
		border-color: rgba(255, 255, 255, 0.25);
	}

	.switch-text {
		font-size: var(--font-xs);
		color: var(--color-text-inverse);
		font-weight: 500;
	}

	.balance-section {
		margin-bottom: var(--spacing-xl);
	}

	.balance-label {
		font-size: var(--font-xs);
		color: rgba(255, 255, 255, 0.65);
		margin-bottom: var(--spacing-xs);
		letter-spacing: 0.3px;
	}

	.balance-value {
		font-size: var(--font-5xl);
		color: var(--color-text-inverse);
		font-weight: 700;
		letter-spacing: -0.5px;
	}

	.account-stats {
		flex-direction: row;
		justify-content: space-between;
		padding-top: var(--spacing-md);
		border-top-width: 1px;
		border-top-style: solid;
		border-top-color: rgba(255, 255, 255, 0.12);
	}

	.stat-item {
		flex: 1;
		align-items: center;
	}

	.stat-label {
		font-size: var(--font-xs);
		color: rgba(255, 255, 255, 0.55);
		margin-bottom: var(--spacing-xs);
	}

	.stat-value {
		font-size: var(--font-sm);
		color: var(--color-text-inverse);
		font-weight: 600;
	}

	.text-green {
		color: #34D399;
	}

	.text-red {
		color: #FB7185;
	}

	.action-row {
		flex-direction: row;
		padding: 0 var(--spacing-lg);
		margin-bottom: var(--spacing-lg);
	}

	.action-btn {
		flex: 1;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		padding: var(--spacing-md) var(--spacing-lg);
		border-radius: var(--radius-md);
		margin: 0 var(--spacing-sm);
		box-shadow: var(--shadow-btn);
		transition: opacity var(--transition-fast);
	}

	.action-deposit {
		background: var(--gradient-primary);
	}

	.action-withdraw {
		background: var(--gradient-gold);
	}

	.action-icon {
		font-size: 18px;
		color: var(--color-text-inverse);
		font-weight: 700;
		margin-right: var(--spacing-sm);
		width: 28px;
		height: 28px;
		line-height: 28px;
		text-align: center;
		border-radius: 14px;
		background-color: rgba(255, 255, 255, 0.2);
	}

	.action-text {
		font-size: var(--font-md);
		color: var(--color-text-inverse);
		font-weight: 600;
	}

	.menu-section {
		margin: 0 var(--spacing-lg) var(--spacing-lg);
		background-color: var(--color-bg-card);
		border-radius: var(--radius-lg);
		padding: var(--spacing-xl) var(--spacing-lg);
		box-shadow: var(--shadow-card);
	}

	.section-title {
		font-size: var(--font-md);
		font-weight: 700;
		color: var(--color-text-primary);
		margin-bottom: var(--spacing-md);
	}

	.menu-list {
		/* container */
	}

	.menu-item {
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		padding: var(--spacing-md) var(--spacing-xs);
		border-bottom-width: 1px;
		border-bottom-style: solid;
		border-bottom-color: var(--color-divider);
	}

	.menu-label {
		font-size: var(--font-base);
		color: var(--color-text-primary);
		font-weight: 500;
	}

	.menu-arrow-icon { width: 16px; height: 16px; opacity: 0.6; }
	.menu-arrow {
		font-size: var(--font-sm);
		color: var(--color-text-muted);
		font-weight: 300;
	}

	.summary-section {
		margin: 0 var(--spacing-lg) var(--spacing-3xl);
		background-color: var(--color-bg-card);
		border-radius: var(--radius-lg);
		padding: var(--spacing-xl) var(--spacing-lg);
		box-shadow: var(--shadow-card);
	}

	.summary-grid {
		flex-direction: row;
		flex-wrap: wrap;
	}

	.summary-item {
		width: 50%;
		align-items: center;
		padding: var(--spacing-md) 0;
	}

	.summary-value {
		font-size: var(--font-xl);
		font-weight: 700;
		color: var(--color-text-primary);
		margin-bottom: var(--spacing-xs);
	}

	.summary-label {
		font-size: var(--font-xs);
		color: var(--color-text-muted);
	}
</style>
