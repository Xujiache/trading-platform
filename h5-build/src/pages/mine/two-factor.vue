<template>
	<scroll-view class="tfa-page" direction="vertical">
		<CustomNavBar title="两步验证" />
		<view class="status-card">
			<text class="status-label">两步验证(2FA)</text>
			<text :class="isEnabled ? 'status-on' : 'status-off'">{{isEnabled ? '已启用' : '未启用'}}</text>
		</view>

		<view class="action-section" v-if="!isEnabled">
			<view v-if="qrCode.length == 0">
				<text class="desc">启用两步验证可增强账户安全。请先生成密钥，然后用 Google Authenticator 扫描二维码。</text>
				<view class="action-btn" @click="generateSecret">
					<text class="btn-text">生成密钥</text>
				</view>
			</view>
			<view v-else class="qr-section">
				<text class="desc">请使用 Google Authenticator 扫描二维码</text>
				<image :src="qrCode" class="qr-image" mode="aspectFit" />
				<text class="secret-text">密钥: {{secret}}</text>
				<view class="form-item">
					<text class="label">验证码</text>
					<input class="input" v-model="token" placeholder="输入6位验证码" type="number" maxlength="6" />
				</view>
				<view class="action-btn" @click="enableTfa">
					<text class="btn-text">启用2FA</text>
				</view>
			</view>
		</view>

		<view class="action-section" v-if="isEnabled">
			<text class="desc">关闭两步验证需要输入密码和当前验证码</text>
			<view class="form-item">
				<text class="label">登录密码</text>
				<input class="input" v-model="password" placeholder="输入登录密码" type="password" />
			</view>
			<view class="form-item">
				<text class="label">验证码</text>
				<input class="input" v-model="token" placeholder="输入6位验证码" type="number" maxlength="6" />
			</view>
			<view class="disable-btn" @click="disableTfa">
				<text class="disable-text">关闭2FA</text>
			</view>
		</view>
	</scroll-view>
</template>

<script setup lang="ts">
	import CustomNavBar from '@/components/CustomNavBar.vue'
	import { ref } from 'vue'
	import { onLoad } from '@dcloudio/uni-app'
	import { get, post } from '../../utils/request.uts'

	const isEnabled = ref(false)
	const qrCode = ref('')
	const secret = ref('')
	const token = ref('')
	const password = ref('')

	onLoad(() => {
		get('/api/mobile/user/2fa/status').then((res) => {
			if (res.code == 200 && res.data != null) {
				const d = res.data as any
				isEnabled.value = (d['enabled'] as boolean) == true
			}
		}).catch((_e) => {})
	})

	function generateSecret() {
		post('/api/mobile/user/2fa/generate').then((res) => {
			if (res.code == 200 && res.data != null) {
				const d = res.data as any
				qrCode.value = (d['qrCode'] as string) ?? ''
				secret.value = (d['secret'] as string) ?? ''
			} else {
				uni.showToast({ title: res.msg, icon: 'none' })
			}
		}).catch((_e) => {})
	}

	function enableTfa() {
		if (token.value.length != 6) { uni.showToast({ title: '请输入6位验证码', icon: 'none' }); return }
		post('/api/mobile/user/2fa/enable', { token: token.value } as any).then((res) => {
			if (res.code == 200) {
				isEnabled.value = true; qrCode.value = ''; token.value = ''
				uni.showToast({ title: '2FA已启用', icon: 'success' })
			} else { uni.showToast({ title: res.msg, icon: 'none' }) }
		}).catch((_e) => {})
	}

	function disableTfa() {
		if (password.value.length == 0) { uni.showToast({ title: '请输入密码', icon: 'none' }); return }
		if (token.value.length != 6) { uni.showToast({ title: '请输入6位验证码', icon: 'none' }); return }
		post('/api/mobile/user/2fa/disable', { password: password.value, token: token.value } as any).then((res) => {
			if (res.code == 200) {
				isEnabled.value = false; password.value = ''; token.value = ''
				uni.showToast({ title: '2FA已关闭', icon: 'success' })
			} else { uni.showToast({ title: res.msg, icon: 'none' }) }
		}).catch((_e) => {})
	}
</script>

<style>
	.tfa-page {
		flex: 1;
		background-color: var(--color-bg-page);
	}

	.status-card {
		margin: var(--spacing-lg);
		padding: var(--spacing-2xl);
		background-color: var(--color-bg-card);
		border-radius: var(--radius-lg);
		align-items: center;
		box-shadow: var(--shadow-card);
	}

	.status-label {
		font-size: var(--font-sm);
		color: var(--color-text-muted);
		margin-bottom: var(--spacing-sm);
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 1px;
	}

	.status-on {
		font-size: var(--font-2xl);
		font-weight: 700;
		color: var(--color-success);
	}

	.status-off {
		font-size: var(--font-2xl);
		font-weight: 700;
		color: var(--color-text-muted);
	}

	.action-section {
		margin: 0 var(--spacing-lg) var(--spacing-lg);
		padding: var(--spacing-2xl);
		background-color: var(--color-bg-card);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-card);
	}

	.desc {
		font-size: var(--font-sm);
		color: var(--color-text-secondary);
		line-height: 22px;
		margin-bottom: var(--spacing-xl);
	}

	.qr-section {
		align-items: center;
	}

	.qr-image {
		width: 200px;
		height: 200px;
		margin: var(--spacing-xl) 0;
		border-radius: var(--radius-md);
		border-width: 1px;
		border-style: solid;
		border-color: var(--color-border);
	}

	.secret-text {
		font-size: var(--font-xs);
		color: var(--color-text-muted);
		margin-bottom: var(--spacing-xl);
		background-color: var(--color-bg-section);
		padding: var(--spacing-sm) var(--spacing-md);
		border-radius: var(--radius-sm);
	}

	.form-item {
		margin-bottom: var(--spacing-xl);
		width: 100%;
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

	.action-btn {
		padding: var(--spacing-lg);
		background: var(--gradient-primary);
		border-radius: var(--radius-md);
		align-items: center;
		margin-top: var(--spacing-sm);
		box-shadow: var(--shadow-btn);
	}

	.btn-text {
		font-size: var(--font-lg);
		color: var(--color-text-inverse);
		font-weight: 600;
	}

	.disable-btn {
		padding: var(--spacing-lg);
		background-color: var(--color-danger-bg);
		border-radius: var(--radius-md);
		align-items: center;
		border-width: 1px;
		border-style: solid;
		border-color: var(--color-danger);
	}

	.disable-text {
		font-size: var(--font-lg);
		color: var(--color-danger);
		font-weight: 600;
	}
</style>
