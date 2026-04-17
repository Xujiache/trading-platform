<template>
	<scroll-view class="settings-page" direction="vertical">
		<CustomNavBar title="账户设置" />
		<view class="menu-section">
			<text class="section-title">安全设置</text>
			<view class="menu-list">
				<view class="menu-item" @click="goPage('/pages/mine/change-password')">
					<text class="menu-label">修改登录密码</text>
					<image class="menu-arrow-icon" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='9 18 15 12 9 6'/%3E%3C/svg%3E" mode="aspectFit"></image>
				</view>
				<view class="menu-item" @click="showTradePassword">
					<text class="menu-label">交易密码</text>
					<image class="menu-arrow-icon" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='9 18 15 12 9 6'/%3E%3C/svg%3E" mode="aspectFit"></image>
				</view>
				<view class="menu-item" @click="showFundPassword">
					<text class="menu-label">资金密码</text>
					<image class="menu-arrow-icon" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='9 18 15 12 9 6'/%3E%3C/svg%3E" mode="aspectFit"></image>
				</view>
				<view class="menu-item" @click="goPage('/pages/mine/two-factor')">
					<text class="menu-label">两步验证(2FA)</text>
					<text class="menu-value">{{tfaStatus}}</text>
				</view>
			</view>
		</view>

		<view class="menu-section">
			<text class="section-title">外观设置</text>
			<view class="theme-bar">
				<view :class="['theme-item', { active: currentTheme == 'auto' }]" @click="setTheme('auto')">
					<text :class="['theme-text', { active: currentTheme == 'auto' }]">跟随系统</text>
				</view>
				<view :class="['theme-item', { active: currentTheme == 'light' }]" @click="setTheme('light')">
					<text :class="['theme-text', { active: currentTheme == 'light' }]">浅色</text>
				</view>
				<view :class="['theme-item', { active: currentTheme == 'dark' }]" @click="setTheme('dark')">
					<text :class="['theme-text', { active: currentTheme == 'dark' }]">深色</text>
				</view>
			</view>
		</view>

		<view class="menu-section">
			<text class="section-title">账户切换</text>
			<view class="switch-bar">
				<view :class="['switch-item', { active: accountType == 'real' }]" @click="switchAccount('real')">
					<text :class="['switch-text', { active: accountType == 'real' }]">实盘</text>
				</view>
				<view :class="['switch-item', { active: accountType == 'demo' }]" @click="switchAccount('demo')">
					<text :class="['switch-text', { active: accountType == 'demo' }]">模拟</text>
				</view>
			</view>
		</view>
	</scroll-view>
</template>

<script setup lang="ts">
	import CustomNavBar from '@/components/CustomNavBar.vue'
	import { ref } from 'vue'
	import { onShow } from '@dcloudio/uni-app'
	import { get, post } from '../../utils/request.uts'

	const tfaStatus = ref('未启用')
	const accountType = ref('demo')
	const currentTheme = ref('auto')

	function setTheme(mode : string) {
		currentTheme.value = mode
		uni.setStorageSync('themeMode', mode)
		let darkMode = false
		if (mode === 'dark') {
			darkMode = true
		} else if (mode === 'auto') {
			try {
				const sysInfo = uni.getSystemInfoSync()
				darkMode = sysInfo.theme === 'dark'
			} catch (e) { darkMode = false }
		}
		// #ifdef H5
		const pageEl = document.querySelector('uni-page-body') || document.documentElement
		if (darkMode) {
			pageEl.setAttribute('data-theme', 'dark')
			document.documentElement.setAttribute('data-theme', 'dark')
		} else {
			pageEl.removeAttribute('data-theme')
			document.documentElement.removeAttribute('data-theme')
		}
		// #endif
	}

	onShow(() => {
		const savedTheme = uni.getStorageSync('themeMode') as string
		if (savedTheme.length > 0) currentTheme.value = savedTheme

		get('/api/mobile/user/2fa/status').then((res) => {
			if (res.code == 200 && res.data != null) {
				const d = res.data as any
				tfaStatus.value = (d['enabled'] as boolean) == true ? '已启用' : '未启用'
			}
		}).catch((_e) => {})

		const info = uni.getStorageSync('userInfo') as string
		if (info.length > 0) {
			const obj = JSON.parse(info)
			if (obj != null) { accountType.value = (obj!['account_type'] as string) ?? 'demo' }
		}
	})

	function goPage(url : string) { uni.navigateTo({ url: url }) }

	function showTradePassword() {
		uni.showModal({
			title: '设置交易密码',
			editable: true,
			placeholderText: '请输入交易密码(至少6位)',
			success: (res) => {
				if (res.confirm && res.content != null && res.content!.length >= 6) {
					post('/api/mobile/user/trade-password', { password: res.content } as any).then((r) => {
						uni.showToast({ title: r.code == 200 ? '设置成功' : r.msg, icon: r.code == 200 ? 'success' : 'none' })
					}).catch((_e) => {})
				}
			}
		})
	}

	function showFundPassword() {
		uni.showModal({
			title: '设置资金密码',
			editable: true,
			placeholderText: '请输入资金密码(至少6位)',
			success: (res) => {
				if (res.confirm && res.content != null && res.content!.length >= 6) {
					post('/api/mobile/user/fund-password', { password: res.content } as any).then((r) => {
						uni.showToast({ title: r.code == 200 ? '设置成功' : r.msg, icon: r.code == 200 ? 'success' : 'none' })
					}).catch((_e) => {})
				}
			}
		})
	}

	function switchAccount(type : string) {
		post('/api/mobile/user/switch-account', { account_type: type } as any).then((res) => {
			if (res.code == 200) {
				accountType.value = type
				const info = uni.getStorageSync('userInfo') as string
				if (info.length > 0) {
					const obj = JSON.parse(info)
					if (obj != null) {
						obj!['account_type'] = type
						uni.setStorageSync('userInfo', JSON.stringify(obj))
					}
				}
				uni.showToast({ title: '切换成功', icon: 'success' })
			} else { uni.showToast({ title: res.msg, icon: 'none' }) }
		}).catch((_e) => {})
	}
</script>

<style>
	.settings-page {
		flex: 1;
		background-color: var(--color-bg-page);
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

	.menu-value {
		font-size: var(--font-sm);
		color: var(--color-text-secondary);
	}

	.theme-bar {
		flex-direction: row;
		margin-top: var(--spacing-md);
		gap: var(--spacing-sm);
	}

	.theme-item {
		flex: 1;
		padding: var(--spacing-md);
		align-items: center;
		border-radius: var(--radius-md);
		background-color: var(--color-bg-section);
		border-width: 1px;
		border-style: solid;
		border-color: var(--color-border-light);
		transition: all var(--transition-fast);
	}

	.theme-item.active {
		background-color: var(--color-primary);
		border-color: var(--color-primary);
	}

	.theme-text {
		font-size: var(--font-sm);
		color: var(--color-text-secondary);
		font-weight: 500;
	}

	.theme-text.active {
		color: var(--color-text-inverse);
		font-weight: 600;
	}

	.switch-bar {
		flex-direction: row;
		margin-top: var(--spacing-md);
	}

	.switch-item {
		flex: 1;
		padding: var(--spacing-md);
		align-items: center;
		border-radius: var(--radius-md);
		background-color: var(--color-bg-section);
		margin-right: var(--spacing-sm);
		border-width: 1px;
		border-style: solid;
		border-color: var(--color-border-light);
		transition-property: background-color;
		transition-duration: var(--transition-fast);
	}

	.switch-item.active {
		background-color: var(--color-primary);
		border-color: var(--color-primary);
	}

	.switch-text {
		font-size: var(--font-sm);
		color: var(--color-text-secondary);
		font-weight: 500;
	}

	.switch-text.active {
		color: var(--color-text-inverse);
		font-weight: 600;
	}
</style>
