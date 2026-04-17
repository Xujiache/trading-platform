<template>
	<view class="loading-state">
		<view class="spinner"></view>
		<text class="loading-text">{{ text }}</text>
	</view>
</template>

<script setup lang="ts">
	defineProps({
		text: {
			type: String,
			default: '加载中...'
		}
	})
</script>

<style>
	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 40px 0;
	}
	.spinner {
		width: 32px;
		height: 32px;
		border: 3px solid rgba(37, 99, 235, 0.1);
		border-top-color: #2563EB;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 12px;
	}
	.loading-text {
		font-size: 14px;
		color: #94A3B8;
	}
	@keyframes spin {
		to { transform: rotate(360deg); }
	}
</style>
