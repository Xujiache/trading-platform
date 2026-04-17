<template>
	<view class="register-page">
		<CustomNavBar title="注册" />
		<view class="header">
			<image class="logo-img" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 24 24' fill='none' stroke='%232563EB' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'/%3E%3C/svg%3E" mode="aspectFit"></image>
			<text class="title">创建账户</text>
			<text class="subtitle">注册后即可体验交易</text>
		</view>

		<view class="form-area">
			<view class="input-group">
				<text class="label">邮箱</text>
				<input class="input" type="text" placeholder="请输入邮箱地址" v-model="email" />
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

			<view class="input-group">
				<text class="label">密码</text>
				<input class="input" type="password" placeholder="8-20位，包含大小写字母和数字" v-model="password" />
			</view>

			<view class="input-group">
				<text class="label">确认密码</text>
				<input class="input" type="password" placeholder="请再次输入密码" v-model="confirmPassword" />
			</view>

			<view class="agreement-row" @click="agreed = !agreed">
				<view class="checkbox" :class="{'checkbox-active': agreed}">
					<image v-if="agreed" class="checkbox-icon" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='20 6 9 17 4 12'/%3E%3C/svg%3E" mode="aspectFit"></image>
				</view>
				<text class="agreement-text">我已阅读并同意</text>
				<text class="agreement-link" @click.stop="goAgreement">《用户协议》</text>
				<text class="agreement-text">和</text>
				<text class="agreement-link" @click.stop="goPrivacy">《隐私政策》</text>
			</view>

			<view class="btn-primary" @click="handleRegister">
				<text class="btn-text">注 册</text>
			</view>

			<view class="login-row">
				<text class="login-hint">已有账户？</text>
				<text class="login-link" @click="goLogin">立即登录</text>
			</view>
		</view>
	</view>
</template>

<script setup lang="ts">
	import CustomNavBar from '@/components/CustomNavBar.vue'
	import { ref } from 'vue'
	import { onUnload } from '@dcloudio/uni-app'
	import { post } from '../../utils/request.uts'

	const email = ref('')
	const code = ref('')
	const password = ref('')
	const confirmPassword = ref('')
	const agreed = ref(false)
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
			type: 'register'
		}).then((res) => {
			if (res.code == 200) {
				uni.showToast({ title: '验证码已发送', icon: 'success' })
				codeCooldown.value = 60
				cooldownTimer = setInterval(() => {
					codeCooldown.value--
					if (codeCooldown.value <= 0) {
						clearInterval(cooldownTimer)
					}
				}, 1000)
			} else {
				uni.showToast({ title: res.msg, icon: 'none' })
			}
		}).catch((_err) => {
			uni.showToast({ title: '发送失败', icon: 'none' })
		})
	}

	function handleRegister() {
		if (email.value.length == 0) {
			uni.showToast({ title: '请输入邮箱', icon: 'none' })
			return
		}
		if (code.value.length == 0) {
			uni.showToast({ title: '请输入验证码', icon: 'none' })
			return
		}
		if (password.value.length < 8) {
			uni.showToast({ title: '密码至少8位', icon: 'none' })
			return
		}
		if (password.value != confirmPassword.value) {
			uni.showToast({ title: '两次密码不一致', icon: 'none' })
			return
		}
		if (!agreed.value) {
			uni.showToast({ title: '请同意用户协议和隐私政策', icon: 'none' })
			return
		}

		uni.showLoading({ title: '注册中...' })
		post('/api/mobile/auth/register', {
			email: email.value,
			code: code.value,
			password: password.value,
			confirmPassword: confirmPassword.value
		}).then((res) => {
			uni.hideLoading()
			if (res.code == 200 && res.data != null) {
				const data = res.data as any
				uni.setStorageSync('token', data['token'] as string)
				uni.setStorageSync('refreshToken', data['refreshToken'] as string)
				uni.setStorageSync('userInfo', JSON.stringify(data['userInfo']))
				uni.showToast({ title: '注册成功', icon: 'success' })
				setTimeout(() => {
					uni.switchTab({ url: '/pages/index/index' })
				}, 1000)
			} else {
				uni.showToast({ title: res.msg, icon: 'none' })
			}
		}).catch((_err) => {
			uni.hideLoading()
			uni.showToast({ title: '注册失败', icon: 'none' })
		})
	}

	function goLogin() {
		uni.navigateBack({})
	}

	function goAgreement() {
		uni.navigateTo({ url: '/pages/mine/agreement' })
	}

	function goPrivacy() {
		uni.navigateTo({ url: '/pages/mine/privacy' })
	}

	onUnload(() => {
		if (cooldownTimer > 0) clearInterval(cooldownTimer)
	})
</script>

<style>
	.register-page {
		flex: 1;
		background: linear-gradient(168deg, var(--color-primary-bg) 0%, var(--color-bg-page) 40%, var(--color-bg-page) 100%);
		padding: 0 var(--spacing-3xl);
	}

	.header {
		margin-top: 48px;
		margin-bottom: 32px;
		padding-left: var(--spacing-xs);
		align-items: center;
	}

	.logo-img {
		width: 64px;
		height: 64px;
		margin-bottom: 16px;
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
		padding: var(--spacing-2xl) var(--spacing-3xl) var(--spacing-3xl);
		box-shadow: var(--shadow-card);
	}

	.input-group {
		margin-bottom: var(--spacing-xl);
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

	.agreement-row {
		flex-direction: row;
		align-items: center;
		margin-bottom: var(--spacing-2xl);
		flex-wrap: wrap;
		padding: var(--spacing-sm) 0;
	}

	.checkbox {
		width: 18px;
		height: 18px;
		border-radius: 4px;
		border: 1.5px solid var(--color-border);
		margin-right: 8px;
		justify-content: center;
		align-items: center;
		background-color: var(--color-bg-input);
		transition: all var(--transition-fast);
	}

	.checkbox-active {
		background-color: var(--color-primary);
		border-color: var(--color-primary);
	}

	.checkbox-icon {
		width: 12px;
		height: 12px;
	}

	.agreement-text {
		font-size: var(--font-xs);
		color: var(--color-text-muted);
		line-height: 18px;
	}

	.agreement-link {
		font-size: var(--font-xs);
		color: var(--color-primary);
		font-weight: 500;
		line-height: 18px;
	}

	.btn-primary {
		height: 52px;
		background: var(--gradient-primary);
		border-radius: var(--radius-lg);
		justify-content: center;
		align-items: center;
		margin-bottom: var(--spacing-2xl);
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

	.login-row {
		flex-direction: row;
		justify-content: center;
		align-items: center;
		padding-top: var(--spacing-sm);
	}

	.login-hint {
		font-size: var(--font-sm);
		color: var(--color-text-muted);
	}

	.login-link {
		font-size: var(--font-sm);
		color: var(--color-primary);
		margin-left: var(--spacing-xs);
		font-weight: 600;
	}
</style>
