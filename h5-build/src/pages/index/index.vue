<template>
	<scroll-view class="home-page" direction="vertical" @scrolltolower="onScrollBottom">
		<!-- 顶部深色背景区域 -->
		<view class="hero-bg">
			<view class="hero-top-bar">
				<text class="hero-brand">交易系统</text>
			</view>
			<!-- Banner 轮播 -->
			<swiper class="banner-swiper" :autoplay="true" :interval="4000" :circular="true" indicator-dots
				indicator-color="rgba(255,255,255,0.4)" indicator-active-color="#ffffff">
				<swiper-item v-for="(banner, idx) in banners" :key="idx" @click="onBannerClick(banner)">
					<image class="banner-image" :src="banner.image_url" mode="aspectFill"></image>
				</swiper-item>
				<swiper-item v-if="banners.length == 0">
					<view class="banner-placeholder">
						<text class="banner-placeholder-text">欢迎使用交易系统</text>
					</view>
				</swiper-item>
			</swiper>
		</view>

		<!-- 8 宫格导航 -->
		<view class="grid-nav">
			<view class="grid-row">
				<view class="grid-item" @click="goPage('/pages/trade/place-order?symbol=XAUUSD')">
					<view class="grid-icon gi-demo"><image class="grid-svg-icon" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23A855F7' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M12 2L2 7l10 5 10-5-10-5z'/%3E%3Cpath d='M2 17l10 5 10-5'/%3E%3Cpath d='M2 12l10 5 10-5'/%3E%3C/svg%3E" mode="aspectFit"></image></view>
					<text class="grid-label">领模拟金</text>
				</view>
				<view class="grid-item" @click="goPage('/pages/assets/deposit')">
					<view class="grid-icon gi-deposit"><image class="grid-svg-icon" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%232563EB' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'/%3E%3C/svg%3E" mode="aspectFit"></image></view>
					<text class="grid-label">快速入金</text>
				</view>
				<view class="grid-item" @click="goPage('/pages/mine/help')">
					<view class="grid-icon gi-help"><image class="grid-svg-icon" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%238B5CF6' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Cpath d='M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3'/%3E%3Cline x1='12' y1='17' x2='12.01' y2='17'/%3E%3C/svg%3E" mode="aspectFit"></image></view>
					<text class="grid-label">帮助中心</text>
				</view>
				<view class="grid-item" @click="goPage('/pages/mine/report')">
					<view class="grid-icon gi-report"><image class="grid-svg-icon" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2310B981' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M18 20V10M12 20V4M6 20v-6'/%3E%3C/svg%3E" mode="aspectFit"></image></view>
					<text class="grid-label">交易报表</text>
				</view>
			</view>
			<view class="grid-row">
				<view class="grid-item" @click="goTab('/pages/trade/index')">
					<view class="grid-icon gi-position"><image class="grid-svg-icon" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23F59E0B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='2' y='3' width='20' height='18' rx='2' ry='2'/%3E%3Cline x1='8' y1='9' x2='16' y2='9'/%3E%3Cline x1='8' y1='13' x2='14' y2='13'/%3E%3Cline x1='8' y1='17' x2='12' y2='17'/%3E%3C/svg%3E" mode="aspectFit"></image></view>
					<text class="grid-label">我的持仓</text>
				</view>
				<view class="grid-item" @click="goPage('/pages/market/alerts')">
					<view class="grid-icon gi-alert"><image class="grid-svg-icon" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23EF4444' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9'/%3E%3Cpath d='M13.73 21a2 2 0 0 1-3.46 0'/%3E%3C/svg%3E" mode="aspectFit"></image></view>
					<text class="grid-label">价格预警</text>
				</view>
				<view class="grid-item" @click="goTab('/pages/market/index')">
					<view class="grid-icon gi-market"><image class="grid-svg-icon" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%230EA5E9' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='23 6 13.5 15.5 8.5 10.5 1 18'/%3E%3Cpolyline points='17 6 23 6 23 12'/%3E%3C/svg%3E" mode="aspectFit"></image></view>
					<text class="grid-label">实时盯盘</text>
				</view>
				<view class="grid-item" @click="goPage('/pages/mine/settings')">
					<view class="grid-icon gi-settings"><image class="grid-svg-icon" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%236366F1' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='3'/%3E%3Cpath d='M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z'/%3E%3C/svg%3E" mode="aspectFit"></image></view>
					<text class="grid-label">账户设置</text>
				</view>
			</view>
		</view>

		<!-- 公告栏 -->
		<view class="notice-bar" v-if="latestAnnouncement.length > 0">
			<image class="notice-svg-icon" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='%23D97706' stroke='%23D97706' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9'/%3E%3Cpath d='M13.73 21a2 2 0 0 1-3.46 0'/%3E%3C/svg%3E" mode="aspectFit"></image>
			<text class="notice-text">{{latestAnnouncement}}</text>
		</view>

		<!-- 热门行情 -->
		<view class="section">
			<view class="section-header">
				<text class="section-title">热门行情</text>
				<text class="section-more" @click="goTab('/pages/market/index')">更多 ></text>
			</view>
			<view class="hot-grid">
				<view v-for="(item, idx) in hotSymbols" :key="idx" class="hot-grid-item" @click="goSymbolDetail(item)">
					<view class="hot-grid-left">
						<text class="hot-symbol">{{item.symbol}}</text>
						<text class="hot-name">{{item.name}}</text>
					</view>
					<view class="hot-grid-center">
						<text class="hot-price" :class="item.change_percent >= 0 ? 'text-up' : 'text-down'">{{formatPrice(item.bid, item.price_decimals)}}</text>
					</view>
					<view class="hot-grid-right">
						<view class="hot-change-badge" :class="item.change_percent >= 0 ? 'badge-up' : 'badge-down'">
							<text class="hot-change-text">{{item.change_percent >= 0 ? '+' : ''}}{{item.change_percent.toFixed(2)}}%</text>
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 中部 Banner -->
		<view class="section" v-if="middleBanners.length > 0">
			<swiper class="middle-banner-swiper" :autoplay="true" :interval="5000" :circular="true">
				<swiper-item v-for="(banner, idx) in middleBanners" :key="idx" @click="onBannerClick(banner)">
					<image class="middle-banner-image" :src="banner.image_url" mode="aspectFill"></image>
				</swiper-item>
			</swiper>
		</view>

		<!-- 奖励卡片 -->
		<view class="section" v-if="rewardCards.length > 0">
			<view class="section-header">
				<text class="section-title">新手福利</text>
			</view>
			<scroll-view class="reward-scroll" direction="horizontal" :show-scrollbar="false">
				<view class="reward-list">
					<view v-for="(card, idx) in rewardCards" :key="idx" class="reward-card"
						:style="{backgroundColor: card.bg_color}">
						<text class="reward-title">{{card.title}}</text>
						<text class="reward-amount">${{card.reward_amount}}</text>
						<text class="reward-desc">{{card.description}}</text>
						<text class="reward-trigger">{{getTriggerLabel(card.trigger_type)}}</text>
					</view>
				</view>
			</scroll-view>
		</view>

		<!-- 活动推荐 -->
		<view class="section" v-if="activities.length > 0">
			<view class="section-header">
				<text class="section-title">热门活动</text>
				<text class="section-more" @click="goPage('/pages/index/activities')">更多 ></text>
			</view>
			<view v-for="(act, idx) in activities" :key="idx" class="activity-card"
				@click="goPage('/pages/index/activity-detail?id=' + act.id)">
				<image v-if="act.cover_image.length > 0" class="activity-cover" :src="act.cover_image"
					mode="aspectFill"></image>
				<view class="activity-info">
					<text class="activity-title">{{act.title}}</text>
					<text class="activity-summary">{{act.summary}}</text>
					<view class="activity-meta">
						<text class="activity-time">{{act.start_time ?? '待定'}}</text>
						<text class="activity-views">{{act.view_count}}次浏览</text>
					</view>
				</view>
			</view>
		</view>

		<view class="bottom-space"></view>
		<FloatingTabBar :current="0" />
	</scroll-view>
</template>

<script setup lang="ts">
	import { ref } from 'vue'
	import { onLoad, onShow, onHide } from '@dcloudio/uni-app'
	import { get, post } from '@/utils/request.uts'
	import { connectWebSocket, subscribeSymbols, disconnectWebSocket } from '@/utils/websocket.uts'
	import FloatingTabBar from '@/components/FloatingTabBar.vue'

	type BannerItem = {
		id : number
		title : string
		image_url : string
		link_type : string
		link_value : string
	}

	type RewardCardItem = {
		id : number
		title : string
		description : string
		reward_type : string
		reward_amount : number
		trigger_type : string
		bg_color : string
	}

	type HotSymbol = {
		id : number
		symbol : string
		name : string
		bid : number
		ask : number
		price_decimals : number
		change_percent : number
	}

	type ActivityItem = {
		id : number
		title : string
		summary : string
		cover_image : string
		start_time : string | null
		view_count : number
	}

	const banners = ref<BannerItem[]>([])
	const middleBanners = ref<BannerItem[]>([])
	const rewardCards = ref<RewardCardItem[]>([])
	const hotSymbols = ref<HotSymbol[]>([])
	const activities = ref<ActivityItem[]>([])
	const latestAnnouncement = ref('')

	onLoad(() => {
		loadHomepageData()
		loadHotSymbols()
		loadActivities()
		loadAnnouncement()
	})

	onShow(() => {
		connectWebSocket((tickData : any) => {
			if (tickData == null) return
			const obj = tickData as any
			const sym = obj['symbol'] as string
			for (let i = 0; i < hotSymbols.value.length; i++) {
				if (hotSymbols.value[i].symbol == sym) {
					hotSymbols.value[i].bid = obj['bid'] as number
					hotSymbols.value[i].ask = obj['ask'] as number
					hotSymbols.value[i].change_percent = obj['change_percent'] as number
					break
				}
			}
		})
	})

	onHide(() => {
		disconnectWebSocket()
	})

	/** 加载首页聚合数据（Banner + 中部Banner + 奖励卡片） */
	function loadHomepageData() {
		get('/api/mobile/operation/homepage').then((res) => {
			if (res.code == 200 && res.data != null) {
				const data = res.data as any
				const bList = JSON.parse<BannerItem[]>(JSON.stringify(data['banners']))
				if (bList != null) banners.value = bList!
				const mbList = JSON.parse<BannerItem[]>(JSON.stringify(data['middleBanners']))
				if (mbList != null) middleBanners.value = mbList!
				const rList = JSON.parse<RewardCardItem[]>(JSON.stringify(data['rewardCards']))
				if (rList != null) rewardCards.value = rList!
			}
		}).catch((_e : any) => { })
	}

	/** 加载热门品种 */
	function loadHotSymbols() {
		get('/api/mobile/market/symbols').then((res) => {
			if (res.code == 200 && res.data != null) {
				const arr = JSON.parse<HotSymbol[]>(JSON.stringify(res.data))
				if (arr != null) {
					const hotList : HotSymbol[] = []
					const symCodes : string[] = []
					for (let i = 0; i < arr!.length; i++) {
						symCodes.push(arr![i].symbol)
						if (hotList.length < 6) {
							hotList.push(arr![i])
						}
					}
					hotSymbols.value = hotList
					subscribeSymbols(symCodes)
				}
			}
		}).catch((_e : any) => { })
	}

	/** 加载活动 */
	function loadActivities() {
		get('/api/mobile/operation/activities?page=1&pageSize=3').then((res) => {
			if (res.code == 200 && res.data != null) {
				const data = res.data as any
				const list = JSON.parse<ActivityItem[]>(JSON.stringify(data['list']))
				if (list != null) activities.value = list!
			}
		}).catch((_e : any) => { })
	}

	/** 加载最新公告 */
	function loadAnnouncement() {
		get('/api/mobile/announcement/list?page=1&pageSize=1').then((res) => {
			if (res.code == 200 && res.data != null) {
				const data = res.data as any
				const list = data['list'] as any[] | null
				if (list != null && list!.length > 0) {
					const first = list![0] as any
					latestAnnouncement.value = first['title'] as string
				}
			}
		}).catch((_e : any) => { })
	}

	function onBannerClick(banner : BannerItem) {
		post(`/api/mobile/operation/banners/${banner.id}/click`).catch((_e : any) => { })
		if (banner.link_type == 'url' && banner.link_value.length > 0) {
			// #ifdef H5
			window.open(banner.link_value)
			// #endif
			// #ifdef APP-PLUS
			plus.runtime.openURL(banner.link_value)
			// #endif
		} else if (banner.link_type == 'page' && banner.link_value.length > 0) {
			uni.navigateTo({ url: banner.link_value })
		} else if (banner.link_type == 'activity' && banner.link_value.length > 0) {
			uni.navigateTo({ url: `/pages/index/activity-detail?id=${banner.link_value}` })
		}
	}

	function goPage(url : string) {
		uni.navigateTo({ url: url })
	}

	function goTab(url : string) {
		uni.switchTab({ url: url })
	}

	function goSymbolDetail(item : HotSymbol) {
		uni.navigateTo({ url: `/pages/market/detail?id=${item.id}&symbol=${item.symbol}` })
	}

	function formatPrice(price : number, decimals : number) : string {
		return price.toFixed(decimals)
	}

	function getTriggerLabel(triggerType : string) : string {
		if (triggerType == 'register') return '注册即领'
		if (triggerType == 'first_deposit') return '首次入金'
		if (triggerType == 'deposit_amount') return '入金达标'
		if (triggerType == 'trade_count') return '交易达标'
		if (triggerType == 'invite') return '邀请好友'
		return '领取'
	}

	function onScrollBottom() { }
</script>

<style>
	.home-page {
		flex: 1;
		background-color: var(--color-bg-page);
	}

	/* 顶部深色区域 */
	.hero-bg {
		background: linear-gradient(180deg, #0F172A 0%, #1E293B 100%);
		padding-top: env(safe-area-inset-top, 20px);
		padding-bottom: 40px;
		border-bottom-left-radius: 28px;
		border-bottom-right-radius: 28px;
	}

	.hero-top-bar {
		display: flex;
		flex-direction: row;
		align-items: center;
		padding: 12px 20px 8px;
	}

	.hero-brand {
		font-size: 20px;
		font-weight: 800;
		color: #FFFFFF;
		letter-spacing: 1px;
	}

	/* Banner */
	.banner-swiper {
		width: 100%;
		height: 180px;
	}
	.banner-image {
		width: calc(100% - 32px);
		height: 160px;
		margin: 0 16px;
		border-radius: var(--radius-lg);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
	}
	.banner-placeholder {
		width: calc(100% - 32px);
		height: 160px;
		margin: 0 16px;
		background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
		justify-content: center;
		align-items: center;
		border-radius: var(--radius-lg);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
	}
	.banner-placeholder-text {
		color: var(--color-text-inverse);
		font-size: var(--font-xl);
		font-weight: bold;
	}

	/* 8 宫格 */
	.grid-nav {
		background-color: var(--color-bg-card);
		padding: var(--spacing-xl) 0 var(--spacing-md);
		margin: -24px var(--spacing-md) var(--spacing-md);
		border-radius: var(--radius-xl);
		box-shadow: var(--shadow-lg);
		position: relative;
		z-index: 10;
	}
	.grid-row {
		flex-direction: row;
	}
	.grid-item {
		flex: 1;
		align-items: center;
		justify-content: center;
		padding: var(--spacing-sm) 0;
	}
	.grid-icon {
		width: 46px;
		height: 46px;
		border-radius: var(--radius-md);
		justify-content: center;
		align-items: center;
		margin-bottom: var(--spacing-xs);
		box-shadow: var(--shadow-sm);
	}
	.gi-demo { background-color: #FEF2F8; }
	.gi-deposit { background-color: var(--color-primary-bg); }
	.gi-help { background-color: #F5F3FF; }
	.gi-report { background-color: #ECFDF5; }
	.gi-position { background-color: #FFFBEB; }
	.gi-alert { background-color: #FEF2F2; }
	.gi-market { background-color: #ECFEFF; }
	.gi-settings { background-color: var(--color-bg-section); }
	.grid-icon-text {
		font-size: 22px;
	}
	.grid-svg-icon {
		width: 24px;
		height: 24px;
	}
	.grid-label {
		font-size: var(--font-xs);
		color: var(--color-text-secondary);
	}

	/* 公告栏 */
	.notice-bar {
		flex-direction: row;
		align-items: center;
		background-color: #FFFBEB;
		padding: var(--spacing-sm) var(--spacing-lg);
		margin: 0 var(--spacing-md) var(--spacing-sm);
		border-radius: var(--radius-md);
		border-left-width: 3px;
		border-left-color: var(--color-accent);
		border-left-style: solid;
	}
	.notice-svg-icon {
		width: 16px;
		height: 16px;
		flex-shrink: 0;
	}
	.notice-icon {
		font-size: var(--font-sm);
		margin-right: var(--spacing-sm);
	}
	.notice-text {
		font-size: var(--font-sm);
		color: #92400E;
		flex: 1;
		lines: 1;
		text-overflow: ellipsis;
	}

	/* 通用板块 */
	.section {
		background-color: var(--color-bg-card);
		margin: 0 var(--spacing-md) var(--spacing-sm);
		padding: var(--spacing-lg) 0 var(--spacing-md);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-card);
	}
	.section-header {
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		padding: 0 var(--spacing-lg);
		margin-bottom: var(--spacing-md);
		border-left-width: 3px;
		border-left-color: var(--color-primary);
		border-left-style: solid;
	}
	.section-title {
		font-size: var(--font-lg);
		font-weight: bold;
		color: var(--color-text-primary);
	}
	.section-more {
		font-size: var(--font-sm);
		color: var(--color-primary);
	}

	/* 热门行情 - 新浪财经风格 */
	.hot-grid {
		padding: 0 var(--spacing-lg);
	}
	.hot-grid-item {
		display: flex;
		flex-direction: row;
		align-items: center;
		padding: 14px 0;
		border-bottom: 1px solid var(--color-divider);
	}
	.hot-grid-item:last-child {
		border-bottom: none;
	}
	.hot-grid-left {
		flex: 1;
		min-width: 0;
	}
	.hot-symbol {
		font-size: var(--font-md);
		font-weight: 700;
		color: var(--color-text-primary);
		letter-spacing: 0.3px;
	}
	.hot-name {
		font-size: var(--font-xs);
		color: var(--color-text-muted);
		margin-top: 2px;
	}
	.hot-grid-center {
		display: flex;
		flex-direction: column;
		width: 110px;
		align-items: flex-end;
		padding-right: var(--spacing-md);
	}
	.hot-price {
		font-size: var(--font-lg);
		font-weight: 700;
		font-family: 'DIN Alternate', 'Roboto Mono', 'SF Mono', monospace;
	}
	.hot-grid-right {
		display: flex;
		flex-direction: column;
		width: 88px;
		align-items: flex-end;
	}
	.hot-change-badge {
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 80px;
		height: 32px;
		border-radius: var(--radius-sm);
		padding: 0 var(--spacing-sm);
	}
	.badge-up {
		background-color: var(--color-success);
	}
	.badge-down {
		background-color: var(--color-danger);
	}
	.hot-change-text {
		font-size: var(--font-sm);
		font-weight: 700;
		color: #FFFFFF;
		font-family: 'DIN Alternate', 'Roboto Mono', 'SF Mono', monospace;
	}
	.text-up {
		color: var(--color-success);
	}
	.text-down {
		color: var(--color-danger);
	}

	/* 中部 Banner */
	.middle-banner-swiper {
		width: 100%;
		height: 100px;
		padding: 0 var(--spacing-lg);
	}
	.middle-banner-image {
		width: 100%;
		height: 100px;
		border-radius: var(--radius-md);
	}

	/* 奖励卡片 */
	.reward-scroll {
		height: 130px;
	}
	.reward-list {
		flex-direction: row;
		padding: var(--spacing-xs) var(--spacing-md);
	}
	.reward-card {
		width: 155px;
		padding: var(--spacing-lg) var(--spacing-md);
		margin: 0 var(--spacing-xs);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-md);
	}
	.reward-title {
		font-size: var(--font-md);
		font-weight: bold;
		color: var(--color-text-inverse);
		margin-bottom: var(--spacing-xs);
	}
	.reward-amount {
		font-size: var(--font-3xl);
		font-weight: bold;
		color: var(--color-text-inverse);
		margin-bottom: var(--spacing-xs);
	}
	.reward-desc {
		font-size: var(--font-xs);
		color: rgba(255, 255, 255, 0.85);
		margin-bottom: var(--spacing-sm);
	}
	.reward-trigger {
		font-size: var(--font-xs);
		color: rgba(255, 255, 255, 0.9);
		background-color: rgba(255, 255, 255, 0.25);
		padding: 3px var(--spacing-sm);
		border-radius: var(--radius-pill);
		align-self: flex-start;
	}

	/* 活动 */
	.activity-card {
		margin: 0 var(--spacing-lg) var(--spacing-md);
		background-color: var(--color-bg-card);
		border-radius: var(--radius-lg);
		overflow: hidden;
		box-shadow: var(--shadow-sm);
	}
	.activity-cover {
		width: 100%;
		height: 130px;
	}
	.activity-info {
		padding: var(--spacing-md) var(--spacing-lg);
	}
	.activity-title {
		font-size: var(--font-md);
		font-weight: bold;
		color: var(--color-text-primary);
		margin-bottom: var(--spacing-xs);
	}
	.activity-summary {
		font-size: var(--font-sm);
		color: var(--color-text-secondary);
		margin-bottom: var(--spacing-sm);
		lines: 2;
		text-overflow: ellipsis;
	}
	.activity-meta {
		flex-direction: row;
		justify-content: space-between;
	}
	.activity-time {
		font-size: var(--font-xs);
		color: var(--color-text-muted);
	}
	.activity-views {
		font-size: var(--font-xs);
		color: var(--color-text-muted);
	}

	.bottom-space {
		height: var(--spacing-3xl);
	}
</style>
