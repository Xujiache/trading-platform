<template>
	<view class="mine-page">
		<view class="user-header">
			<view class="avatar-wrap">
				<image v-if="avatarUrl != ''" class="avatar-image" :src="avatarUrl" mode="aspectFill"></image>
				<text v-else class="avatar-text">{{avatarText}}</text>
			</view>
			<view class="user-info">
				<text class="user-name">{{nickname || email || '未登录'}}</text>
				<text class="user-email" v-if="email != ''">{{email}}</text>
			</view>
		</view>

		<view class="menu-section">
			<text class="section-title">账户管理</text>
			<view class="menu-list">
				<view class="menu-item" @click="goPage('/pages/mine/kyc')">
					<text class="menu-label">实名认证</text>
					<image class="menu-arrow-icon" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='9 18 15 12 9 6'/%3E%3C/svg%3E" mode="aspectFit"></image>
				</view>
				<view class="menu-item" @click="goPage('/pages/mine/edit-profile')">
					<text class="menu-label">编辑资料</text>
					<image class="menu-arrow-icon" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='9 18 15 12 9 6'/%3E%3C/svg%3E" mode="aspectFit"></image>
				</view>
				<view class="menu-item" @click="goPage('/pages/mine/settings')">
					<text class="menu-label">账户设置</text>
					<image class="menu-arrow-icon" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='9 18 15 12 9 6'/%3E%3C/svg%3E" mode="aspectFit"></image>
				</view>
				<view class="menu-item" @click="goPage('/pages/mine/risk-assessment')">
					<text class="menu-label">风险测评</text>
					<image class="menu-arrow-icon" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='9 18 15 12 9 6'/%3E%3C/svg%3E" mode="aspectFit"></image>
				</view>
			</view>
		</view>

		<view class="menu-section">
			<text class="section-title">交易工具</text>
			<view class="menu-list">
				<view class="menu-item" @click="goPage('/pages/mine/report')">
					<text class="menu-label">交易报表</text>
					<image class="menu-arrow-icon" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='9 18 15 12 9 6'/%3E%3C/svg%3E" mode="aspectFit"></image>
				</view>
				<view class="menu-item" @click="goPage('/pages/mine/messages')">
					<text class="menu-label">消息中心</text>
					<image class="menu-arrow-icon" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='9 18 15 12 9 6'/%3E%3C/svg%3E" mode="aspectFit"></image>
				</view>
			</view>
		</view>

		<view class="menu-section">
			<text class="section-title">帮助与支持</text>
			<view class="menu-list">
				<view class="menu-item" @click="goPage('/pages/mine/help')">
					<text class="menu-label">帮助中心</text>
					<image class="menu-arrow-icon" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='9 18 15 12 9 6'/%3E%3C/svg%3E" mode="aspectFit"></image>
				</view>
				<view class="menu-item" @click="goPage('/pages/mine/ticket-list')">
					<text class="menu-label">我的工单</text>
					<image class="menu-arrow-icon" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='9 18 15 12 9 6'/%3E%3C/svg%3E" mode="aspectFit"></image>
				</view>
				<view class="menu-item" @click="goPage('/pages/mine/chat')">
					<text class="menu-label">在线客服</text>
					<image class="menu-arrow-icon" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='9 18 15 12 9 6'/%3E%3C/svg%3E" mode="aspectFit"></image>
				</view>
			</view>
		</view>

		<view class="menu-section">
			<text class="section-title">关于</text>
			<view class="menu-list">
				<view class="menu-item" @click="goPage('/pages/mine/about')">
					<text class="menu-label">关于我们</text>
					<image class="menu-arrow-icon" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='9 18 15 12 9 6'/%3E%3C/svg%3E" mode="aspectFit"></image>
				</view>
				<view class="menu-item" @click="goPage('/pages/mine/agreement')">
					<text class="menu-label">用户协议</text>
					<image class="menu-arrow-icon" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='9 18 15 12 9 6'/%3E%3C/svg%3E" mode="aspectFit"></image>
				</view>
				<view class="menu-item" @click="goPage('/pages/mine/privacy')">
					<text class="menu-label">隐私政策</text>
					<image class="menu-arrow-icon" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='9 18 15 12 9 6'/%3E%3C/svg%3E" mode="aspectFit"></image>
				</view>
			</view>
		</view>

		<view class="logout-btn" @click="doLogout">
			<text class="logout-text">退出登录</text>
		</view>
		<FloatingTabBar :current="4" />
	</view>
</template>

<script setup lang="ts">
	import { ref, computed } from 'vue'
	import { onShow } from '@dcloudio/uni-app'
	import FloatingTabBar from '../../components/FloatingTabBar.vue'

	const nickname = ref('')
	const email = ref('')
	const avatarUrl = ref('')

	const avatarText = computed(() : string => {
		if (nickname.value.length > 0) return nickname.value.substring(0, 1)
		if (email.value.length > 0) return email.value.substring(0, 1).toUpperCase()
		return '?'
	})

	onShow(() => {
		const info = uni.getStorageSync('userInfo') as string
		if (info.length > 0) {
			const obj = JSON.parse(info)
			if (obj != null) {
				nickname.value = (obj!['nickname'] as string) ?? ''
				email.value = (obj!['email'] as string) ?? ''
				avatarUrl.value = (obj!['avatar'] as string) ?? ''
			}
		}
	})

	function goPage(url : string) {
		uni.navigateTo({ url: url })
	}

	function doLogout() {
		uni.showModal({
			title: '退出登录',
			content: '确定要退出吗？',
			success: (res) => {
				if (res.confirm) {
					uni.removeStorageSync('token')
					uni.removeStorageSync('refreshToken')
					uni.removeStorageSync('userInfo')
					uni.reLaunch({ url: '/pages/auth/login' })
				}
			}
		})
	}
</script>

<style>
	.mine-page {
		flex: 1;
		background-color: var(--color-bg-page);
	}

	.user-header {
		flex-direction: row;
		align-items: center;
		padding: var(--spacing-3xl) var(--spacing-xl);
		background: var(--gradient-dark);
	}

	.avatar-wrap {
		width: 60px;
		height: 60px;
		border-radius: 30px;
		background-color: rgba(255, 255, 255, 0.15);
		justify-content: center;
		align-items: center;
		margin-right: var(--spacing-lg);
		border-width: 2px;
		border-style: solid;
		border-color: rgba(255, 255, 255, 0.25);
	}

	.avatar-image {
		width: 60px;
		height: 60px;
		border-radius: 30px;
	}

	.avatar-text {
		font-size: var(--font-3xl);
		font-weight: 700;
		color: var(--color-text-inverse);
	}

	.user-info {
		flex: 1;
	}

	.user-name {
		font-size: var(--font-xl);
		font-weight: 700;
		color: var(--color-text-inverse);
		margin-bottom: var(--spacing-xs);
	}

	.user-email {
		font-size: var(--font-sm);
		color: rgba(255, 255, 255, 0.7);
	}

	.menu-section {
		margin: var(--spacing-md) var(--spacing-lg);
		background-color: var(--color-bg-card);
		border-radius: var(--radius-lg);
		padding: var(--spacing-lg) var(--spacing-xl);
		box-shadow: var(--shadow-card);
	}

	.section-title {
		font-size: var(--font-xs);
		font-weight: 600;
		color: var(--color-text-muted);
		margin-bottom: var(--spacing-sm);
		text-transform: uppercase;
		letter-spacing: 1px;
	}

	.menu-item {
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		padding: var(--spacing-lg) 0;
		border-bottom-width: 1px;
		border-bottom-style: solid;
		border-bottom-color: var(--color-divider);
	}

	.menu-label {
		font-size: var(--font-md);
		color: var(--color-text-primary);
		font-weight: 500;
	}

	.menu-arrow-icon { width: 16px; height: 16px; opacity: 0.6; }
	.menu-arrow {
		font-size: var(--font-sm);
		color: var(--color-text-muted);
	}

	.logout-btn {
		margin: var(--spacing-2xl) var(--spacing-lg);
		margin-bottom: var(--spacing-3xl);
		padding: var(--spacing-lg);
		background-color: var(--color-danger-bg);
		border-radius: var(--radius-lg);
		align-items: center;
		border-width: 1px;
		border-style: solid;
		border-color: var(--color-danger);
	}

	.logout-text {
		font-size: var(--font-md);
		color: var(--color-danger);
		font-weight: 600;
	}
</style>
