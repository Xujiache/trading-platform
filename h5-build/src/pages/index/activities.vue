<template>
	<scroll-view class="activities-page" direction="vertical" @scrolltolower="loadMore">
		<CustomNavBar title="热门活动" />
		<view v-for="(item, idx) in activities" :key="idx" class="activity-card"
			@click="goDetail(item.id)">
			<image v-if="item.cover_image.length > 0" class="activity-cover" :src="item.cover_image"
				mode="aspectFill"></image>
			<view class="activity-body">
				<text class="activity-title">{{item.title}}</text>
				<text class="activity-summary">{{item.summary}}</text>
				<view class="activity-footer">
					<text class="activity-time">{{item.start_time ?? '待定'}} ~ {{item.end_time ?? '待定'}}</text>
					<text class="activity-views">{{item.view_count}}次浏览</text>
				</view>
			</view>
		</view>
		<view v-if="activities.length == 0 && !isLoading" class="empty-view">
			<text class="empty-text">暂无活动</text>
		</view>
		<view v-if="isLoading" class="loading-view">
			<text class="loading-text">加载中...</text>
		</view>
	</scroll-view>
</template>

<script setup lang="ts">
	import CustomNavBar from '@/components/CustomNavBar.vue'
	import { ref } from 'vue'
	import { onLoad } from '@dcloudio/uni-app'
	import { get } from '@/utils/request.uts'

	type ActivityItem = {
		id : number
		title : string
		summary : string
		cover_image : string
		start_time : string | null
		end_time : string | null
		view_count : number
	}

	const activities = ref<ActivityItem[]>([])
	const page = ref(1)
	const hasMore = ref(true)
	const isLoading = ref(false)

	onLoad(() => {
		loadActivities()
	})

	function loadActivities() {
		if (isLoading.value || !hasMore.value) return
		isLoading.value = true
		get(`/api/mobile/operation/activities?page=${page.value}&pageSize=10`).then((res) => {
			if (res.code == 200 && res.data != null) {
				const data = res.data as any
				const list = JSON.parse<ActivityItem[]>(JSON.stringify(data['list']))
				if (list != null) {
					for (let i = 0; i < list!.length; i++) {
						activities.value.push(list![i])
					}
					const pagination = data['pagination'] as any | null
					if (pagination != null) {
						const total = pagination!['total'] as number
						if (activities.value.length >= total) hasMore.value = false
					}
				}
				page.value++
			}
			isLoading.value = false
		}).catch((_e : any) => {
			isLoading.value = false
		})
	}

	function loadMore() {
		loadActivities()
	}

	function goDetail(id : number) {
		uni.navigateTo({ url: `/pages/index/activity-detail?id=${id}` })
	}
</script>

<style>
	.activities-page {
		flex: 1;
		background-color: var(--color-bg-page);
	}

	.activity-card {
		margin: var(--spacing-md) var(--spacing-md) 0;
		background-color: var(--color-bg-card);
		border-radius: var(--radius-lg);
		overflow: hidden;
		box-shadow: var(--shadow-card);
	}

	.activity-cover {
		width: 100%;
		height: 170px;
	}

	.activity-body {
		padding: var(--spacing-lg);
	}

	.activity-title {
		font-size: var(--font-lg);
		font-weight: bold;
		color: var(--color-text-primary);
		margin-bottom: var(--spacing-sm);
	}

	.activity-summary {
		font-size: var(--font-sm);
		color: var(--color-text-secondary);
		margin-bottom: var(--spacing-md);
		lines: 2;
		text-overflow: ellipsis;
	}

	.activity-footer {
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		padding-top: var(--spacing-sm);
		border-top-width: 1px;
		border-top-color: var(--color-divider);
		border-top-style: solid;
	}

	.activity-time {
		font-size: var(--font-xs);
		color: var(--color-text-muted);
	}

	.activity-views {
		font-size: var(--font-xs);
		color: var(--color-text-muted);
	}

	.empty-view {
		padding: 100px 0;
		align-items: center;
	}

	.empty-text {
		font-size: var(--font-md);
		color: var(--color-text-muted);
	}

	.loading-view {
		padding: var(--spacing-3xl) 0;
		align-items: center;
	}

	.loading-text {
		font-size: var(--font-sm);
		color: var(--color-text-muted);
	}
</style>
