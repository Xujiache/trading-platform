<template>
	<scroll-view class="detail-page" direction="vertical">
		<CustomNavBar title="活动详情" />
		<view v-if="detail != null" class="detail-content">
			<image v-if="detail!.cover_image.length > 0" class="detail-cover" :src="detail!.cover_image"
				mode="aspectFill"></image>
			<view class="detail-body">
				<text class="detail-title">{{detail!.title}}</text>
				<view class="detail-meta">
					<text class="meta-type">{{getTypeLabel(detail!.activity_type)}}</text>
					<text class="meta-time">{{detail!.start_time ?? '待定'}} ~ {{detail!.end_time ?? '待定'}}</text>
				</view>
				<view class="detail-stats">
					<text class="stat-item">浏览 {{detail!.view_count}}</text>
					<text class="stat-item">参与 {{detail!.current_participants}}</text>
				</view>
				<view v-if="detail!.summary.length > 0" class="detail-section">
					<text class="section-label">活动摘要</text>
					<text class="section-text">{{detail!.summary}}</text>
				</view>
				<view v-if="detail!.content != null && detail!.content!.length > 0" class="detail-section">
					<text class="section-label">活动详情</text>
					<rich-text :nodes="detail!.content!"></rich-text>
				</view>
				<view v-if="detail!.rules != null && detail!.rules!.length > 0" class="detail-section">
					<text class="section-label">活动规则</text>
					<text class="section-text">{{detail!.rules!}}</text>
				</view>
				<view v-if="detail!.prize_desc.length > 0" class="detail-section">
					<text class="section-label">奖品说明</text>
					<text class="section-text">{{detail!.prize_desc}}</text>
				</view>
			</view>
		</view>
		<view v-else class="loading-view">
			<text class="loading-text">加载中...</text>
		</view>
	</scroll-view>
</template>

<script setup lang="ts">
	import CustomNavBar from '@/components/CustomNavBar.vue'
	import { ref } from 'vue'
	import { onLoad } from '@dcloudio/uni-app'
	import { get } from '@/utils/request.uts'

	type ActivityDetail = {
		id : number
		title : string
		summary : string
		content : string | null
		cover_image : string
		activity_type : string
		status : string
		start_time : string | null
		end_time : string | null
		rules : string | null
		prize_desc : string
		view_count : number
		current_participants : number
	}

	const detail = ref<ActivityDetail | null>(null)

	onLoad((options : OnLoadOptions) => {
		const id = options['id'] ?? ''
		if (id.length > 0) {
			loadDetail(id)
		}
	})

	function loadDetail(id : string) {
		get(`/api/mobile/operation/activities/${id}`).then((res) => {
			if (res.code == 200 && res.data != null) {
				const d = JSON.parse<ActivityDetail>(JSON.stringify(res.data))
				if (d != null) detail.value = d!
			}
		}).catch((_e : any) => { })
	}

	function getTypeLabel(t : string) : string {
		if (t == 'promotion') return '促销活动'
		if (t == 'competition') return '交易竞赛'
		if (t == 'bonus') return '赠金活动'
		return '其他活动'
	}
</script>

<style>
	.detail-page {
		flex: 1;
		background-color: var(--color-bg-card);
	}

	.detail-cover {
		width: 100%;
		height: 220px;
	}

	.detail-body {
		padding: var(--spacing-xl) var(--spacing-lg);
	}

	.detail-title {
		font-size: var(--font-2xl);
		font-weight: bold;
		color: var(--color-text-primary);
		margin-bottom: var(--spacing-md);
	}

	.detail-meta {
		flex-direction: row;
		align-items: center;
		margin-bottom: var(--spacing-md);
	}

	.meta-type {
		font-size: var(--font-xs);
		color: var(--color-primary);
		background-color: var(--color-primary-bg);
		padding: var(--spacing-xs) var(--spacing-sm);
		border-radius: var(--radius-sm);
		margin-right: var(--spacing-md);
	}

	.meta-time {
		font-size: var(--font-xs);
		color: var(--color-text-muted);
	}

	.detail-stats {
		flex-direction: row;
		margin-bottom: var(--spacing-xl);
		padding-bottom: var(--spacing-lg);
		border-bottom-width: 1px;
		border-bottom-color: var(--color-divider);
		border-bottom-style: solid;
	}

	.stat-item {
		font-size: var(--font-sm);
		color: var(--color-text-secondary);
		margin-right: var(--spacing-xl);
	}

	.detail-section {
		margin-bottom: var(--spacing-xl);
		padding-top: var(--spacing-lg);
		border-top-width: 1px;
		border-top-color: var(--color-divider);
		border-top-style: solid;
	}

	.section-label {
		font-size: var(--font-lg);
		font-weight: bold;
		color: var(--color-text-primary);
		margin-bottom: var(--spacing-md);
		padding-left: var(--spacing-sm);
		border-left-width: 3px;
		border-left-color: var(--color-primary);
		border-left-style: solid;
	}

	.section-text {
		font-size: var(--font-md);
		color: var(--color-text-secondary);
		line-height: 24px;
	}

	.loading-view {
		padding: 100px 0;
		align-items: center;
	}

	.loading-text {
		font-size: var(--font-md);
		color: var(--color-text-muted);
	}
</style>
