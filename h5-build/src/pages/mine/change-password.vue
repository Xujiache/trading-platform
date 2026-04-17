<template>
	<scroll-view class="pwd-page" direction="vertical">
		<CustomNavBar title="修改密码" />
		<view class="form-section">
			<text class="form-title">修改登录密码</text>
			<view class="form-item">
				<text class="label">原密码</text>
				<input class="input" v-model="oldPwd" type="password" placeholder="请输入原密码" />
			</view>
			<view class="form-item">
				<text class="label">新密码</text>
				<input class="input" v-model="newPwd" type="password" placeholder="至少8位" />
			</view>
			<view class="form-item">
				<text class="label">确认密码</text>
				<input class="input" v-model="confirmPwd" type="password" placeholder="再次输入新密码" />
			</view>
			<view style="height: 80px; flex-shrink: 0;"></view>
			<view class="submit-btn" @click="changePwd">
				<text class="submit-text">确认修改</text>
			</view>
		</view>
	</scroll-view>
</template>

<script setup lang="ts">
	import CustomNavBar from '@/components/CustomNavBar.vue'
	import { ref } from 'vue'
	import { post } from '../../utils/request.uts'

	const oldPwd = ref('')
	const newPwd = ref('')
	const confirmPwd = ref('')

	function changePwd() {
		if (oldPwd.value.length == 0) { uni.showToast({ title: '请输入原密码', icon: 'none' }); return }
		if (newPwd.value.length < 8) { uni.showToast({ title: '新密码至少8位', icon: 'none' }); return }
		if (newPwd.value != confirmPwd.value) { uni.showToast({ title: '两次密码不一致', icon: 'none' }); return }

		post('/api/mobile/user/change-password', { old_password: oldPwd.value, new_password: newPwd.value } as any).then((res) => {
			if (res.code == 200) {
				uni.showToast({ title: '修改成功', icon: 'success' })
				setTimeout(() => { uni.navigateBack() }, 1500)
			} else { uni.showToast({ title: res.msg, icon: 'none' }) }
		}).catch((_e) => {})
	}
</script>

<style>
	.pwd-page {
		flex: 1;
		background-color: var(--color-bg-page);
	}

	.form-section {
		margin: var(--spacing-lg);
		padding: var(--spacing-2xl);
		background-color: var(--color-bg-card);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-card);
	}

	.form-title {
		font-size: var(--font-xl);
		font-weight: 700;
		color: var(--color-text-primary);
		margin-bottom: var(--spacing-2xl);
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
		padding: var(--spacing-md) var(--spacing-lg);
		font-size: var(--font-md);
		background-color: var(--color-bg-input);
		color: var(--color-text-primary);
		transition-property: border-color;
		transition-duration: var(--transition-fast);
	}

	.submit-btn {
		margin-top: var(--spacing-lg);
		padding: var(--spacing-lg);
		background: var(--gradient-primary);
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
		font-size: var(--font-lg);
		color: var(--color-text-inverse);
		font-weight: 600;
	}
</style>
