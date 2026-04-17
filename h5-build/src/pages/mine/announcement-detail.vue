<template>
	<scroll-view class="detail-page" direction="vertical">
		<CustomNavBar title="公告详情" />
		<view class="content">
			<text class="title">{{annoTitle}}</text>
			<text class="meta">{{publishedAt}} · 浏览 {{viewCount}}</text>
			<rich-text v-if="annoContent.length > 0" :nodes="annoContent"></rich-text>
		</view>
	</scroll-view>
</template>

<script setup lang="ts">
	import CustomNavBar from '@/components/CustomNavBar.vue'
	import { ref } from 'vue'
	import { onLoad } from '@dcloudio/uni-app'
	import { get } from '../../utils/request.uts'

	const annoTitle = ref('')
	const annoContent = ref('')
	const publishedAt = ref('')
	const viewCount = ref(0)

	onLoad((options : OnLoadOptions) => {
		const id = options['id'] ?? ''
		if (id.length > 0) {
			get(`/api/mobile/announcement/${id}`).then((res) => {
				if (res.code == 200 && res.data != null) {
					const d = res.data as any
					annoTitle.value = (d['title'] as string) ?? ''
					annoContent.value = (d['content'] as string) ?? ''
					publishedAt.value = (d['published_at'] as string) ?? ''
					viewCount.value = (d['view_count'] as number) ?? 0
				}
			}).catch((_e) => {})
		}
	})
</script>

<style>
	.detail-page {
		flex: 1;
		background-color: var(--color-bg-card);
	}

	.content {
		padding: var(--spacing-xl) var(--spacing-xl) var(--spacing-3xl);
	}

	.title {
		font-size: var(--font-2xl);
		font-weight: 700;
		color: var(--color-text-primary);
		margin-bottom: var(--spacing-sm);
		line-height: 32px;
	}

	.meta {
		font-size: var(--font-xs);
		color: var(--color-text-muted);
		margin-bottom: var(--spacing-xl);
		padding-bottom: var(--spacing-lg);
		border-bottom-width: 1px;
		border-bottom-style: solid;
		border-bottom-color: var(--color-divider);
	}
</style>
