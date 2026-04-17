<template>
	<view class="custom-nav-bar-wrapper">
		<view class="custom-nav-bar" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="nav-left" @click="goBack">
				<view v-if="showBack" class="back-icon-wrap">
					<view class="back-arrow"></view>
				</view>
			</view>
			<view class="nav-center">
				<text class="nav-title">{{ title }}</text>
			</view>
			<view class="nav-right"></view>
		</view>
		<view class="nav-placeholder" :style="{ height: (44 + statusBarHeight) + 'px' }"></view>
	</view>
</template>

<script setup lang="ts">
	import { ref } from 'vue'
	import { onLoad } from '@dcloudio/uni-app'

	const props = defineProps({
		title: {
			type: String,
			default: ''
		},
		showBack: {
			type: Boolean,
			default: true
		}
	})

	const statusBarHeight = ref(20)

	onLoad(() => {
		const sysInfo = uni.getSystemInfoSync()
		if (sysInfo.statusBarHeight) {
			statusBarHeight.value = sysInfo.statusBarHeight
		}
	})

	function goBack() {
		if (props.showBack) {
			const pages = getCurrentPages()
			if (pages.length > 1) {
				uni.navigateBack()
			} else {
				uni.switchTab({ url: '/pages/index/index' })
			}
		}
	}
</script>

<style>
	.custom-nav-bar-wrapper {
		width: 100%;
	}
	.custom-nav-bar {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 999;
		background-color: var(--color-bg-card, #FFFFFF);
		display: flex;
		flex-direction: row;
		align-items: center;
		height: 44px;
		box-sizing: content-box;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
	}
	.nav-left {
		width: 44px;
		height: 44px;
		display: flex;
		justify-content: center;
		align-items: center;
	}
	.back-icon-wrap {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 24px;
		height: 24px;
	}
	.back-arrow {
		width: 10px;
		height: 10px;
		border-left: 2.5px solid var(--color-text-primary, #0F172A);
		border-bottom: 2.5px solid var(--color-text-primary, #0F172A);
		transform: rotate(45deg);
	}
	.nav-center {
		flex: 1;
		display: flex;
		justify-content: center;
		align-items: center;
	}
	.nav-title {
		font-size: 16px;
		font-weight: 600;
		color: var(--color-text-primary, #0F172A);
	}
	.nav-right {
		width: 44px;
		height: 44px;
	}
	.nav-placeholder {
		width: 100%;
		flex-shrink: 0;
	}
</style>
