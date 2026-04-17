<template>
	<view class="empty-state">
		<image class="empty-icon" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 24 24' fill='none' stroke='%23CBD5E1' stroke-width='1' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Cline x1='12' y1='8' x2='12' y2='12'/%3E%3Cline x1='12' y1='16' x2='12.01' y2='16'/%3E%3C/svg%3E" mode="aspectFit"></image>
		<text class="empty-text">{{ text }}</text>
	</view>
</template>

<script setup lang="ts">
	defineProps({
		text: {
			type: String,
			default: '暂无数据'
		}
	})
</script>

<style>
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 60px 0;
	}
	.empty-icon {
		width: 100px;
		height: 100px;
		margin-bottom: 16px;
		opacity: 0.8;
	}
	.empty-text {
		font-size: 15px;
		color: #94A3B8;
		letter-spacing: 0.5px;
	}
</style>
