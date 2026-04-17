<template>
	<scroll-view class="about-page" direction="vertical">
		<CustomNavBar title="关于我们" />
		<view class="content">
			<text class="title">关于我们</text>
			<rich-text v-if="richContent.length > 0" :nodes="richContent"></rich-text>
			<view v-else class="default-content">
				<text class="paragraph">欢迎使用交易系统，我们致力于为用户提供安全、便捷、专业的贵金属与能源CFD交易服务。</text>
				<text class="paragraph">我们的团队由资深金融从业者和技术专家组成，拥有丰富的行业经验。</text>
				<text class="paragraph">如需帮助，请通过在线客服或工单系统联系我们。</text>
			</view>
		</view>
	</scroll-view>
</template>

<script setup lang="ts">
	import CustomNavBar from '@/components/CustomNavBar.vue'
	import { ref } from 'vue'
	import { onLoad } from '@dcloudio/uni-app'
	import { get } from '../../utils/request.uts'

	const richContent = ref('')

	onLoad(() => {
		get('/api/mobile/content/about_us').then((res) => {
			if (res.code == 200 && res.data != null) {
				const data = res.data as any
				const content = data['content'] as string
				if (content != null && content.length > 0) { richContent.value = content }
			}
		}).catch((_err) => {})
	})
</script>

<style>
	.about-page {
		flex: 1;
		background-color: var(--color-bg-page);
	}

	.content {
		margin: var(--spacing-xl);
		padding: var(--spacing-2xl) var(--spacing-xl);
		background-color: var(--color-bg-card);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-card);
	}

	.title {
		font-size: var(--font-3xl);
		font-weight: 700;
		color: var(--color-text-primary);
		text-align: center;
		margin-bottom: var(--spacing-xs);
		letter-spacing: 1px;
	}

	.default-content {
		padding-top: var(--spacing-lg);
		border-top-width: 1px;
		border-top-style: solid;
		border-top-color: var(--color-divider);
		margin-top: var(--spacing-xl);
	}

	.paragraph {
		font-size: var(--font-sm);
		color: var(--color-text-secondary);
		line-height: 26px;
		margin-bottom: var(--spacing-md);
	}
</style>
