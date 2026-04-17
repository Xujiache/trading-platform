<template>
	<scroll-view class="privacy-page" direction="vertical">
		<CustomNavBar title="隐私政策" />
		<view class="content">
			<text class="title">隐私政策</text>
			<rich-text v-if="richContent.length > 0" :nodes="richContent"></rich-text>
			<view v-else class="default-content">
				<text class="section-title">一、信息收集</text>
				<text class="paragraph">我们收集您在注册和使用过程中提供的个人信息，包括但不限于邮箱地址、姓名、身份证信息等，用于账户管理和身份验证。</text>

				<text class="section-title">二、信息使用</text>
				<text class="paragraph">我们使用收集的信息来提供和改善服务，包括账户验证、交易处理、客服支持和安全保障。</text>

				<text class="section-title">三、信息保护</text>
				<text class="paragraph">我们采用行业标准的安全措施保护您的个人信息，包括数据加密、访问控制和安全审计。</text>

				<text class="section-title">四、信息共享</text>
				<text class="paragraph">未经您的同意，我们不会向第三方共享您的个人信息，法律法规要求除外。</text>

				<text class="section-title">五、Cookie使用</text>
				<text class="paragraph">我们可能使用Cookie和类似技术来改善用户体验和分析服务使用情况。</text>

				<text class="section-title">六、用户权利</text>
				<text class="paragraph">您有权访问、更正或删除您的个人信息。如需行使这些权利，请通过客服渠道联系我们。</text>

				<text class="section-title">七、政策更新</text>
				<text class="paragraph">我们可能不时更新本隐私政策，更新后将在平台公告。</text>
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
		get('/api/mobile/content/privacy_policy').then((res) => {
			if (res.code == 200 && res.data != null) {
				const data = res.data as any
				const content = data['content'] as string
				if (content != null && content.length > 0) {
					richContent.value = content
				}
			}
		}).catch((_err) => {})
	})
</script>

<style>
	.privacy-page {
		flex: 1;
		background-color: var(--color-bg-card);
	}

	.content {
		padding: var(--spacing-xl) var(--spacing-xl) var(--spacing-3xl);
	}

	.title {
		font-size: var(--font-3xl);
		font-weight: 700;
		color: var(--color-text-primary);
		text-align: center;
		margin-bottom: var(--spacing-xl);
		padding-bottom: var(--spacing-lg);
		border-bottom-width: 1px;
		border-bottom-style: solid;
		border-bottom-color: var(--color-divider);
	}

	.default-content {
		padding: 0;
	}

	.section-title {
		font-size: var(--font-md);
		font-weight: 700;
		color: var(--color-text-primary);
		margin-top: var(--spacing-xl);
		margin-bottom: var(--spacing-sm);
	}

	.paragraph {
		font-size: var(--font-sm);
		color: var(--color-text-secondary);
		line-height: 26px;
		margin-bottom: var(--spacing-md);
	}
</style>
