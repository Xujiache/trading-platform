<template>
	<scroll-view class="create-page" direction="vertical">
		<CustomNavBar title="创建工单" />
		<view class="form-section">
			<view class="form-item">
				<text class="label">分类</text>
				<view class="cat-bar">
					<view v-for="c in catOptions" :key="c.value" :class="['cat-opt', { active: category == c.value }]"
						@click="category = c.value">
						<text :class="['cat-opt-text', { active: category == c.value }]">{{c.label}}</text>
					</view>
				</view>
			</view>
			<view class="form-item">
				<text class="label">标题</text>
				<input class="input" v-model="title" placeholder="请输入工单标题" />
			</view>
			<view class="form-item">
				<text class="label">描述</text>
				<textarea class="textarea" v-model="content" placeholder="请详细描述您的问题" />
			</view>
			<view style="height: 80px; flex-shrink: 0;"></view>
			<view class="submit-btn" @click="submitTicket">
				<text class="submit-text">提交工单</text>
			</view>
		</view>
	</scroll-view>
</template>

<script setup lang="ts">
	import CustomNavBar from '@/components/CustomNavBar.vue'
	import { ref } from 'vue'
	import { post } from '../../utils/request.uts'

	type CatOpt = { value : string; label : string }

	const catOptions = ref<CatOpt[]>([
		{ value: 'trade', label: '交易' }, { value: 'fund', label: '资金' },
		{ value: 'account', label: '账户' }, { value: 'technical', label: '技术' }, { value: 'other', label: '其他' }
	])
	const category = ref('other')
	const title = ref('')
	const content = ref('')

	function submitTicket() {
		if (title.value.length == 0) { uni.showToast({ title: '请输入标题', icon: 'none' }); return }
		if (content.value.length == 0) { uni.showToast({ title: '请输入描述', icon: 'none' }); return }
		post('/api/mobile/ticket', { category: category.value, title: title.value, content: content.value } as any).then((res) => {
			if (res.code == 200 || res.code == 201) {
				uni.showToast({ title: '创建成功', icon: 'success' })
				setTimeout(() => { uni.navigateBack() }, 1500)
			} else { uni.showToast({ title: res.msg, icon: 'none' }) }
		}).catch((_e) => {})
	}
</script>

<style>
	.create-page {
		flex: 1;
		background-color: var(--color-bg-page);
	}

	.form-section {
		margin: var(--spacing-lg);
		padding: var(--spacing-xl);
		background-color: var(--color-bg-card);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-card);
	}

	.form-item {
		margin-bottom: var(--spacing-xl);
	}

	.label {
		font-size: var(--font-sm);
		color: var(--color-text-secondary);
		margin-bottom: var(--spacing-sm);
		font-weight: 600;
	}

	.input {
		border-width: 1px;
		border-style: solid;
		border-color: var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--spacing-sm) var(--spacing-md);
		font-size: var(--font-sm);
		background-color: var(--color-bg-input);
		color: var(--color-text-primary);
		transition: border-color var(--transition-fast);
	}

	.textarea {
		border-width: 1px;
		border-style: solid;
		border-color: var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--spacing-md);
		font-size: var(--font-sm);
		height: 140px;
		background-color: var(--color-bg-input);
		color: var(--color-text-primary);
		line-height: 22px;
		transition: border-color var(--transition-fast);
	}

	.cat-bar {
		flex-direction: row;
		flex-wrap: wrap;
	}

	.cat-opt {
		padding: var(--spacing-xs) var(--spacing-lg);
		border-radius: var(--radius-pill);
		background-color: var(--color-bg-section);
		margin-right: var(--spacing-sm);
		margin-bottom: var(--spacing-sm);
		border-width: 1px;
		border-style: solid;
		border-color: var(--color-border-light);
		transition: all var(--transition-fast);
	}

	.cat-opt.active {
		background-color: var(--color-primary);
		border-color: var(--color-primary);
	}

	.cat-opt-text {
		font-size: var(--font-xs);
		color: var(--color-text-secondary);
		font-weight: 500;
	}

	.cat-opt-text.active {
		color: var(--color-text-inverse);
	}

	.submit-btn {
		margin-top: var(--spacing-sm);
		padding: var(--spacing-md);
		background-image: var(--gradient-primary);
		border-radius: var(--radius-lg);
		align-items: center;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
		position: fixed;
		bottom: 16px;
		left: 16px;
		right: 16px;
		z-index: 99;
	}

	.submit-text {
		font-size: var(--font-md);
		color: var(--color-text-inverse);
		font-weight: 600;
	}
</style>
