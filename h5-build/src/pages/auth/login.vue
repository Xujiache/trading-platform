<template>
	<view class="login-page">
		<CustomNavBar title="登录" />
		<view class="header">
			<image class="logo-img" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 24 24' fill='none' stroke='%232563EB' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'/%3E%3C/svg%3E" mode="aspectFit"></image>
			<text class="title">欢迎登录</text>
			<text class="subtitle">黄金白银石油交易系统</text>
		</view>

		<view class="form-area">
			<view class="input-group">
				<text class="label">邮箱</text>
				<input class="input" type="text" placeholder="请输入邮箱地址" v-model="email" />
			</view>

			<view class="input-group">
				<text class="label">密码</text>
				<view class="password-row">
					<input class="input flex-1" :type="showPwd ? 'text' : 'password'" placeholder="请输入密码"
						v-model="password" />
					<text class="toggle-pwd" @click="showPwd = !showPwd">{{showPwd ? '隐藏' : '显示'}}</text>
				</view>
			</view>

			<view class="forgot-row">
				<text class="forgot-link" @click="goForgot">忘记密码？</text>
			</view>

			<view class="btn-primary" @click="handleLogin">
				<text class="btn-text">登 录</text>
			</view>

			<view class="register-row">
				<text class="register-hint">还没有账户？</text>
				<text class="register-link" @click="goRegister">立即注册</text>
			</view>
		</view>
	</view>
</template>

<script setup lang="ts">
	import CustomNavBar from '@/components/CustomNavBar.vue'
	import { ref } from 'vue'
	import { onBackPress } from '@dcloudio/uni-app'
	import { post, resetLoginRedirect } from '../../utils/request.uts'

	resetLoginRedirect()

	onBackPress(() => {
		uni.switchTab({ url: '/pages/index/index' })
		return true
	})

	const email = ref('')
	const password = ref('')
	const showPwd = ref(false)

	function handleLogin() {
		if (email.value.length == 0) {
			uni.showToast({ title: '请输入邮箱', icon: 'none' })
			return
		}
		if (password.value.length == 0) {
			uni.showToast({ title: '请输入密码', icon: 'none' })
			return
		}

		uni.showLoading({ title: '登录中...' })
		post('/api/mobile/auth/login', {
			email: email.value,
			password: password.value
		}).then((res) => {
			uni.hideLoading()
			if (res.code == 200 && res.data != null) {
				const data = res.data as any
				uni.setStorageSync('token', data['token'] as string)
				uni.setStorageSync('refreshToken', data['refreshToken'] as string)
				uni.setStorageSync('userInfo', JSON.stringify(data['userInfo']))
				uni.showToast({ title: '登录成功', icon: 'success' })
				setTimeout(() => {
					uni.switchTab({ url: '/pages/index/index' })
				}, 1000)
			} else {
				uni.showToast({ title: res.msg, icon: 'none' })
			}
		}).catch((_err) => {
			uni.hideLoading()
			uni.showToast({ title: '登录失败', icon: 'none' })
		})
	}

	function goRegister() {
		uni.navigateTo({ url: '/pages/auth/register' })
	}

	function goForgot() {
		uni.navigateTo({ url: '/pages/auth/forgot-password' })
	}
</script>

<style>
	.login-page {
		flex: 1;
		background: linear-gradient(168deg, var(--color-primary-bg) 0%, var(--color-bg-page) 40%, var(--color-bg-page) 100%);
		padding: 0 var(--spacing-3xl);
	}

	.header {
		margin-top: 80px;
		margin-bottom: 48px;
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
		padding: var(--spacing-3xl);
		box-shadow: var(--shadow-card);
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

	.password-row {
		flex-direction: row;
		align-items: center;
	}

	.flex-1 {
		flex: 1;
	}

	.toggle-pwd {
		font-size: var(--font-xs);
		color: var(--color-primary);
		padding: 0 var(--spacing-md);
		font-weight: 600;
		letter-spacing: 0.3px;
	}

	.forgot-row {
		align-items: flex-end;
		margin-bottom: var(--spacing-3xl);
	}

	.forgot-link {
		font-size: var(--font-sm);
		color: var(--color-primary);
		font-weight: 500;
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

	.register-row {
		flex-direction: row;
		justify-content: center;
		align-items: center;
		padding-top: var(--spacing-sm);
	}

	.register-hint {
		font-size: var(--font-sm);
		color: var(--color-text-muted);
	}

	.register-link {
		font-size: var(--font-sm);
		color: var(--color-primary);
		margin-left: var(--spacing-xs);
		font-weight: 600;
	}
</style>
