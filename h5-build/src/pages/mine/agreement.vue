<template>
	<scroll-view class="agreement-page" direction="vertical">
		<CustomNavBar title="用户协议" />
		<view class="content">
			<text class="title">用户协议</text>
			<rich-text v-if="richContent.length > 0" :nodes="richContent"></rich-text>
			<view v-else class="default-content">
				<text class="section-title">一、服务条款</text>
				<text class="paragraph">欢迎使用本交易平台。在使用本平台服务前，请仔细阅读本协议。使用本平台即表示您同意接受本协议的所有条款。</text>

				<text class="section-title">二、账户注册</text>
				<text class="paragraph">用户应提供真实、准确的注册信息。每位用户只能注册一个账户。用户对其账户安全负全部责任。</text>

				<text class="section-title">三、交易规则</text>
				<text class="paragraph">本平台提供贵金属和能源类CFD交易服务。用户应充分了解相关交易风险，自行承担交易后果。</text>

				<text class="section-title">四、资金安全</text>
				<text class="paragraph">用户资金由专用账户管理。入金和出金需经过审核流程。平台不承担因用户操作不当导致的资金损失。</text>

				<text class="section-title">五、免责声明</text>
				<text class="paragraph">本平台不对因市场波动、系统故障等不可抗力因素导致的损失承担责任。</text>

				<text class="section-title">六、协议修改</text>
				<text class="paragraph">本平台有权根据需要修改本协议，修改后的协议将在平台公告后生效。</text>
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
		get('/api/mobile/content/user_agreement').then((res) => {
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
	.agreement-page {
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
