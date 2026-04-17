<template>
	<scroll-view class="detail-page" direction="vertical">
		<CustomNavBar title="工单详情" />
		<view class="card">
			<view class="header">
				<text class="ticket-no">{{ticketNo}}</text>
				<text :class="'status status-' + status">{{statusText}}</text>
			</view>
			<text class="title">{{ticketTitle}}</text>
			<text class="content-text">{{ticketContent}}</text>
			<text class="time">提交时间: {{createdAt}}</text>
		</view>

		<view class="reply-card" v-if="replyContent.length > 0">
			<text class="reply-label">客服回复</text>
			<text class="reply-text">{{replyContent}}</text>
			<text class="reply-time">{{repliedAt}}</text>
		</view>

		<view class="no-reply" v-else>
			<text class="no-reply-text">暂无回复，请耐心等待</text>
		</view>
	</scroll-view>
</template>

<script setup lang="ts">
	import CustomNavBar from '@/components/CustomNavBar.vue'
	import { ref, computed } from 'vue'
	import { onLoad } from '@dcloudio/uni-app'
	import { get } from '../../utils/request.uts'

	const ticketNo = ref('')
	const ticketTitle = ref('')
	const ticketContent = ref('')
	const status = ref('')
	const createdAt = ref('')
	const replyContent = ref('')
	const repliedAt = ref('')

	const statusText = computed(() : string => {
		if (status.value == 'pending') return '待处理'
		if (status.value == 'processing') return '处理中'
		if (status.value == 'resolved') return '已解决'
		if (status.value == 'closed') return '已关闭'
		return status.value
	})

	onLoad((options : OnLoadOptions) => {
		const id = options['id'] ?? ''
		if (id.length > 0) {
			get(`/api/mobile/ticket/${id}`).then((res) => {
				if (res.code == 200 && res.data != null) {
					const d = res.data as any
					ticketNo.value = (d['ticket_no'] as string) ?? ''
					ticketTitle.value = (d['title'] as string) ?? ''
					ticketContent.value = (d['content'] as string) ?? ''
					status.value = (d['status'] as string) ?? ''
					createdAt.value = (d['created_at'] as string) ?? ''
					replyContent.value = (d['reply_content'] as string) ?? ''
					repliedAt.value = (d['replied_at'] as string) ?? ''
				}
			}).catch((_e) => {})
		}
	})
</script>

<style>
	.detail-page {
		flex: 1;
		background-color: var(--color-bg-page);
	}

	.card {
		margin: var(--spacing-lg);
		padding: var(--spacing-xl);
		background-color: var(--color-bg-card);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-card);
	}

	.header {
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--spacing-md);
	}

	.ticket-no {
		font-size: var(--font-xs);
		color: var(--color-text-muted);
		font-family: monospace;
	}

	.status {
		font-size: var(--font-xs);
		padding: 3px var(--spacing-sm);
		border-radius: var(--radius-pill);
		font-weight: 600;
	}

	.status-pending {
		color: var(--color-danger);
		background-color: var(--color-danger-bg);
	}

	.status-processing {
		color: var(--color-warning);
		background-color: var(--color-warning-bg);
	}

	.status-resolved {
		color: var(--color-success);
		background-color: var(--color-success-bg);
	}

	.status-closed {
		color: var(--color-text-muted);
		background-color: var(--color-bg-section);
	}

	.title {
		font-size: var(--font-lg);
		font-weight: 700;
		color: var(--color-text-primary);
		margin-bottom: var(--spacing-md);
	}

	.content-text {
		font-size: var(--font-sm);
		color: var(--color-text-secondary);
		line-height: 24px;
		margin-bottom: var(--spacing-md);
	}

	.time {
		font-size: var(--font-xs);
		color: var(--color-text-muted);
	}

	.reply-card {
		margin: 0 var(--spacing-lg) var(--spacing-lg);
		padding: var(--spacing-xl);
		background-color: var(--color-bg-card);
		border-radius: var(--radius-lg);
		border-left-width: 3px;
		border-left-style: solid;
		border-left-color: var(--color-success);
		box-shadow: var(--shadow-card);
	}

	.reply-label {
		font-size: var(--font-sm);
		font-weight: 600;
		color: var(--color-success);
		margin-bottom: var(--spacing-sm);
	}

	.reply-text {
		font-size: var(--font-sm);
		color: var(--color-text-primary);
		line-height: 24px;
		margin-bottom: var(--spacing-sm);
	}

	.reply-time {
		font-size: var(--font-xs);
		color: var(--color-text-muted);
	}

	.no-reply {
		margin: 0 var(--spacing-lg);
		padding: var(--spacing-3xl);
		background-color: var(--color-bg-card);
		border-radius: var(--radius-lg);
		align-items: center;
		box-shadow: var(--shadow-card);
	}

	.no-reply-text {
		font-size: var(--font-sm);
		color: var(--color-text-muted);
	}
</style>
