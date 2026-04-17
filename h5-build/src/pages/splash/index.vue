<template>
	<view class="splash-container">
		<view v-if="showAd && adConfig.enabled" class="ad-area">
			<image v-if="adConfig.imageUrl.length > 0" class="ad-image" :src="adConfig.imageUrl" mode="aspectFill"
				@click="onAdClick"></image>
			<view v-else-if="adConfig.richText.length > 0" class="rich-text-area">
				<rich-text :nodes="adConfig.richText"></rich-text>
			</view>
			<view class="skip-btn" @click="skipAd">
				<text class="skip-text">跳过 {{countdown}}s</text>
			</view>
		</view>
		<view v-else class="brand-area">
			<text class="brand-title">黄金白银石油交易系统</text>
			<text class="brand-subtitle">安全 · 专业 · 便捷</text>
		</view>
	</view>
</template>

<script setup lang="ts">
	import { ref } from 'vue'
	import { onLoad, onUnload } from '@dcloudio/uni-app'
	import { get } from '../../utils/request.uts'

	type AdConfig = {
		enabled : boolean
		imageUrl : string
		linkUrl : string
		duration : number
		richText : string
	}

	const showAd = ref(false)
	const countdown = ref(3)
	const adConfig = ref<AdConfig>({
		enabled: false,
		imageUrl: '',
		linkUrl: '',
		duration: 3,
		richText: ''
	})
	let timer = 0

	onLoad(() => {
		loadSplashConfig()
	})

	onUnload(() => {
		if (timer > 0) {
			clearInterval(timer)
		}
	})

	function loadSplashConfig() {
		get('/api/mobile/homepage/splash-ad').then((res) => {
			if (res.code == 200 && res.data != null) {
				const data = res.data as AdConfig
				adConfig.value = data
				if (data.enabled) {
					showAd.value = true
					countdown.value = data.duration > 0 ? data.duration : 3
					startCountdown()
				} else {
					goHome()
				}
			} else {
				goHome()
			}
		}).catch((_err) => {
			goHome()
		})
	}

	function startCountdown() {
		timer = setInterval(() => {
			countdown.value--
			if (countdown.value <= 0) {
				clearInterval(timer)
				goHome()
			}
		}, 1000)
	}

	function skipAd() {
		if (timer > 0) {
			clearInterval(timer)
		}
		goHome()
	}

	function onAdClick() {
		if (adConfig.value.linkUrl.length > 0) {
			const link = adConfig.value.linkUrl
			if (link.startsWith('/pages')) {
				uni.navigateTo({ url: link })
			}
		}
	}

	function goHome() {
		uni.switchTab({ url: '/pages/index/index' })
	}
</script>

<style>
	.splash-container {
		flex: 1;
		background-image: var(--gradient-dark);
		justify-content: center;
		align-items: center;
	}

	.ad-area {
		flex: 1;
		width: 100%;
		position: relative;
	}

	.ad-image {
		width: 100%;
		height: 100%;
	}

	.skip-btn {
		position: absolute;
		top: 60px;
		right: var(--spacing-xl);
		background-color: rgba(255, 255, 255, 0.12);
		border-radius: var(--radius-pill);
		padding: var(--spacing-xs) var(--spacing-lg);
		border-width: 1px;
		border-style: solid;
		border-color: rgba(255, 255, 255, 0.2);
	}

	.skip-text {
		color: rgba(255, 255, 255, 0.9);
		font-size: var(--font-xs);
		font-weight: 500;
	}

	.brand-area {
		justify-content: center;
		align-items: center;
	}

	.brand-title {
		color: var(--color-text-inverse);
		font-size: var(--font-5xl);
		font-weight: 700;
		margin-bottom: var(--spacing-md);
		letter-spacing: 2px;
	}

	.brand-subtitle {
		color: rgba(255, 255, 255, 0.5);
		font-size: var(--font-sm);
		letter-spacing: 8px;
		font-weight: 300;
	}

	.rich-text-area {
		flex: 1;
		padding: var(--spacing-xl);
	}
</style>
