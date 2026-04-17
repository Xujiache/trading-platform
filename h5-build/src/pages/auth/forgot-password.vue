<template>
	<view class="forgot-page">
		<CustomNavBar title="找回密码" />
		<view class="header">
			<text class="title">找回密码</text>
			<text class="subtitle">通过邮箱验证码重置密码</text>
		</view>

		<!-- 步骤1：验证邮箱 -->
		<view v-if="step == 1" class="form-area">
			<view class="input-group">
				<text class="label">邮箱</text>
				<input class="input" type="text" placeholder="请输入注册邮箱" v-model="email" />
			</view>

			<view class="input-group">
				<text class="label">验证码</text>
				<view class="code-row">
					<input class="input flex-1" type="number" placeholder="请输入验证码" v-model="code" />
					<view class="code-btn" :class="{'code-btn-disabled': codeCooldown > 0}" @click="sendCode">
						<text class="code-btn-text">{{codeCooldown > 0 ? codeCooldown + 's' : '获取验证码'}}</text>
					</view>
				</view>
			</view>

			<view class="btn-primary" @click="step = 2">
				<text class="btn-text">下一步</text>
			</view>
		</view>

		<!-- 步骤2：设置新密码 -->
		<view v-if="step == 2" class="form-area">
			<view class="input-group">
				<text class="label">新密码</text>
				<input class="input" type="password" placeholder="8-20位，包含大小写字母和数字" v-model="newPassword" />
			</view>

			<view class="input-group">
				<text class="label">确认密码</text>
				<input class="input" type="password" placeholder="请再次输入新密码" v-model="confirmPassword" />
			</view>

			<view class="btn-primary" @click="handleReset">
				<text class="btn-text">重置密码</text>
			</view>
		</view>
	</view>
</template>

<script setup lang="ts">
	import CustomNavBar from '@/components/CustomNavBar.vue'
	import { ref } from 'vue'
	import { onUnload } from '@dcloudio/uni-app'
	import { post } from '../../utils/request.uts'

	const step = ref(1)
	const email = ref('')
	const code = ref('')
	const newPassword = ref('')
	const confirmPassword = ref('')
	const codeCooldown = ref(0)
	let cooldownTimer = 0

	function sendCode() {
		if (codeCooldown.value > 0) return
		if (email.value.length == 0) {
			uni.showToast({ title: '请输入邮箱', icon: 'none' })
			return
		}

		post('/api/mobile/auth/send-code', {
			email: email.value,
			type: 'reset_password'
		}).then((res) => {
			if (res.code == 200) {
				uni.showToast({ title: '验证码已发送', icon: 'success' })
				codeCooldown.value = 60
				cooldownTimer = setInterval(() => {
					codeCooldown.value--
					if (codeCooldown.value <= 0) clearInterval(cooldownTimer)
				}, 1000)
			} else {
				uni.showToast({ title: res.msg, icon: 'none' })
			}
		}).catch((_err) => {
			uni.showToast({ title: '发送失败', icon: 'none' })
		})
	}

	function handleReset() {
		if (newPassword.value.length < 8) {
			uni.showToast({ title: '密码至少8位', icon: 'none' })
			return
		}
		if (newPassword.value != confirmPassword.value) {
			uni.showToast({ title: '两次密码不一致', icon: 'none' })
			return
		}

		uni.showLoading({ title: '重置中...' })
		post('/api/mobile/auth/reset-password', {
			email: email.value,
			code: code.value,
			newPassword: newPassword.value,
			confirmPassword: confirmPassword.value
		}).then((res) => {
			uni.hideLoading()
			if (res.code == 200) {
				uni.showToast({ title: '密码重置成功', icon: 'success' })
				setTimeout(() => {
					uni.navigateBack({})
				}, 1500)
			} else {
				uni.showToast({ title: res.msg, icon: 'none' })
			}
		}).catch((_err) => {
			uni.hideLoading()
			uni.showToast({ title: '重置失败', icon: 'none' })
		})
	}

	onUnload(() => {
		if (cooldownTimer > 0) clearInterval(cooldownTimer)
	})
</script>

<style>
	.forgot-page {
		flex: 1;
		background: linear-gradient(168deg, var(--color-primary-bg) 0%, var(--color-bg-page) 40%, var(--color-bg-page) 100%);
		padding: 0 var(--spacing-3xl);
	}

	.header {
		margin-top: 48px;
		margin-bottom: 36px;
		padding-left: var(--spacing-xs);
	}

	.title {
		font-size: var(--font-4xl);
		font-weight: 800;
		color: var(--color-text-primary);
		margin-bottom: var(--spacing-sm);
		letter-spacing: 0.5px;
	}

	.subtitle {
		font-size: var(--font-sm);
		color: var(--color-text-muted);
		letter-spacing: 0.3px;
	}

	.form-area {
		flex: 1;
		background-color: var(--color-bg-card);
		border-radius: var(--radius-xl);
		padding: var(--spacing-3xl);
		box-shadow: var(--shadow-card);
		border-top: 3px solid var(--color-primary);
	}

	.input-group {
		margin-bottom: var(--spacing-2xl);
	}

	.label {
		font-size: var(--font-xs);
		color: var(--color-text-secondary);
		margin-bottom: var(--spacing-sm);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.6px;
	}

	.input {
		height: 50px;
		border: 1.5px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: 0 var(--spacing-lg);
		font-size: var(--font-md);
		color: var(--color-text-primary);
		background-color: var(--color-bg-input);
		transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
	}

	.input:focus {
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
		background-color: var(--color-bg-card);
	}

	.code-row {
		flex-direction: row;
		align-items: center;
	}

	.flex-1 {
		flex: 1;
	}

	.code-btn {
		margin-left: var(--spacing-md);
		background: var(--gradient-primary);
		border-radius: var(--radius-lg);
		padding: 14px var(--spacing-lg);
		box-shadow: var(--shadow-sm);
		transition: opacity var(--transition-fast);
	}

	.code-btn:active {
		opacity: 0.85;
	}

	.code-btn-disabled {
		background: var(--color-text-placeholder);
		box-shadow: none;
	}

	.code-btn-text {
		color: var(--color-text-inverse);
		font-size: var(--font-sm);
		font-weight: 600;
		white-space: nowrap;
	}

	.btn-primary {
		height: 52px;
		background: var(--gradient-primary);
		border-radius: var(--radius-lg);
		justify-content: center;
		align-items: center;
		margin-top: var(--spacing-lg);
		box-shadow: var(--shadow-btn);
		transition: opacity var(--transition-fast), transform var(--transition-fast);
	}

	.btn-primary:active {
		opacity: 0.9;
		transform: scale(0.98);
	}

	.btn-text {
		color: var(--color-text-inverse);
		font-size: var(--font-lg);
		font-weight: 700;
		letter-spacing: 4px;
	}
</style>
