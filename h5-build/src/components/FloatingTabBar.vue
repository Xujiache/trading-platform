<template>
	<view class="tab-bar-spacer"></view>
	<view class="floating-tab-bar">
		<view class="tab-bar-inner">
			<view v-for="(tab, idx) in tabs" :key="idx" class="tab-item" :class="{'tab-active': currentIndex === idx}" @click="switchTab(idx)">
				<view class="tab-icon-wrap">
					<image class="tab-icon" :src="currentIndex === idx ? tab.activeIcon : tab.icon" mode="aspectFit"></image>
				</view>
				<text class="tab-label" :class="{'tab-label-active': currentIndex === idx}">{{tab.text}}</text>
			</view>
		</view>
	</view>
</template>

<script setup lang="ts">
	import { ref } from 'vue'
	import { onShow } from '@dcloudio/uni-app'

	const homeSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'/%3E%3Cpolyline points='9 22 9 12 15 12 15 22'/%3E%3C/svg%3E"
	const homeActiveSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='%232563EB' stroke='%232563EB' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'/%3E%3Cpolyline points='9 22 9 12 15 12 15 22' stroke='white'/%3E%3C/svg%3E"

	const marketSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='22 12 18 12 15 21 9 3 6 12 2 12'/%3E%3C/svg%3E"
	const marketActiveSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%232563EB' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='22 12 18 12 15 21 9 3 6 12 2 12'/%3E%3C/svg%3E"

	const tradeSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='17 1 21 5 17 9'/%3E%3Cpath d='M3 11V9a4 4 0 0 1 4-4h14'/%3E%3Cpolyline points='7 23 3 19 7 15'/%3E%3Cpath d='M21 13v2a4 4 0 0 1-4 4H3'/%3E%3C/svg%3E"
	const tradeActiveSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%232563EB' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='17 1 21 5 17 9'/%3E%3Cpath d='M3 11V9a4 4 0 0 1 4-4h14'/%3E%3Cpolyline points='7 23 3 19 7 15'/%3E%3Cpath d='M21 13v2a4 4 0 0 1-4 4H3'/%3E%3C/svg%3E"

	const assetsSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='2' y='4' width='20' height='16' rx='2'/%3E%3Cpath d='M2 10h20'/%3E%3Cpath d='M16 14h2'/%3E%3C/svg%3E"
	const assetsActiveSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='%232563EB' stroke='%232563EB' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='2' y='4' width='20' height='16' rx='2'/%3E%3Cpath d='M2 10h20' stroke='white'/%3E%3Cpath d='M16 14h2' stroke='white'/%3E%3C/svg%3E"

	const mineSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'/%3E%3Ccircle cx='12' cy='7' r='4'/%3E%3C/svg%3E"
	const mineActiveSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='%232563EB' stroke='%232563EB' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'/%3E%3Ccircle cx='12' cy='7' r='4'/%3E%3C/svg%3E"

	type TabItem = {
		text: string
		path: string
		icon: string
		activeIcon: string
	}

	const tabs: TabItem[] = [
		{ text: '首页', path: '/pages/index/index', icon: homeSvg, activeIcon: homeActiveSvg },
		{ text: '行情', path: '/pages/market/index', icon: marketSvg, activeIcon: marketActiveSvg },
		{ text: '交易', path: '/pages/trade/index', icon: tradeSvg, activeIcon: tradeActiveSvg },
		{ text: '资产', path: '/pages/assets/index', icon: assetsSvg, activeIcon: assetsActiveSvg },
		{ text: '我的', path: '/pages/mine/index', icon: mineSvg, activeIcon: mineActiveSvg },
	]

	const props = defineProps<{ current: number }>()
	const currentIndex = ref(props.current)

	onShow(() => {
		currentIndex.value = props.current
	})

	function switchTab(idx: number) {
		if (idx === currentIndex.value) return
		currentIndex.value = idx
		uni.switchTab({ url: tabs[idx].path })
	}
</script>

<style>
	.tab-bar-spacer {
		height: 80px;
		flex-shrink: 0;
	}

	.floating-tab-bar {
		position: fixed;
		bottom: 12px;
		left: 12px;
		right: 12px;
		z-index: 999;
	}

	.tab-bar-inner {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-around;
		height: 60px;
		background-color: var(--color-bg-card, rgba(255, 255, 255, 0.92));
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border-radius: 20px;
		box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1), 0 1px 4px rgba(0, 0, 0, 0.06);
		padding: 0 4px;
	}

	.tab-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		flex: 1;
		height: 56px;
		border-radius: 14px;
		transition: all 0.25s ease;
		cursor: pointer;
		position: relative;
	}

	.tab-active {
		background-color: rgba(37, 99, 235, 0.08);
	}

	.tab-icon-wrap {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		margin-bottom: 2px;
		transition: transform 0.25s ease;
	}

	.tab-active .tab-icon-wrap {
		transform: scale(1.1);
	}

	.tab-icon {
		width: 22px;
		height: 22px;
	}

	.tab-label {
		font-size: 10px;
		color: var(--color-text-muted, #94A3B8);
		font-weight: 500;
		transition: color 0.25s ease;
		line-height: 1.2;
	}

	.tab-label-active {
		color: #2563EB;
		font-weight: 600;
	}
</style>
