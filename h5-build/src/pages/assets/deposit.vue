<template>
	<view class="deposit-page">
		<CustomNavBar title="入金" />
		<view class="method-card">
			<text class="card-title">选择支付方式</text>
			<view class="method-row">
				<view v-for="(m, idx) in methods" :key="idx" class="method-pill"
					:class="{'method-pill-active': selectedMethod == m.value}" @click="selectedMethod = m.value">
					<text class="method-pill-text" :class="{'method-pill-text-active': selectedMethod == m.value}">{{m.label}}</text>
				</view>
			</view>
		</view>

		<view class="amount-card">
			<text class="card-title">入金金额</text>
			<view class="amount-row">
				<text class="amount-sign">$</text>
				<input class="amount-input" type="digit" v-model="amount" placeholder="请输入金额" />
			</view>
			<text class="amount-hint">最低入金: ${{payConfig.minDepositAmount}}</text>
		</view>

		<view class="qrcode-card">
			<text class="card-title">{{getQrcodeTitle()}}</text>
			<view class="qrcode-display">
				<view v-if="getCurrentQrcode().length > 0" class="qrcode-box">
					<image class="qrcode-image" :src="getCurrentQrcode()" mode="aspectFit"></image>
				</view>
				<view v-else class="qrcode-empty">
					<image class="qrcode-empty-icon" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 24 24' fill='none' stroke='%23CBD5E1' stroke-width='1.5'%3E%3Crect x='3' y='3' width='7' height='7'/%3E%3Crect x='14' y='3' width='7' height='7'/%3E%3Crect x='3' y='14' width='7' height='7'/%3E%3Cpath d='M14 14h3v3h-3zM18 18h3v3h-3zM14 18h3v3h-3z'/%3E%3C/svg%3E" mode="aspectFit"></image>
					<text class="qrcode-empty-text">待管理员上传收款码</text>
					<text class="qrcode-empty-hint">请联系客服或管理员配置</text>
				</view>
			</view>
			<view v-if="selectedMethod == 'usdt' && payConfig.usdtTrc20Address.length > 0" class="address-section">
				<text class="address-label">TRC20 收款地址</text>
				<view class="address-box">
					<text class="address-value" user-select="true">{{payConfig.usdtTrc20Address}}</text>
				</view>
			</view>
		</view>

		<view class="proof-card">
			<text class="card-title">支付凭证 (选填)</text>
			<text class="card-subtitle">上传转账截图有助于加速审核</text>
			<view class="proof-upload" @click="chooseProof">
				<image v-if="proofImage != ''" :src="proofImage" class="proof-img" mode="aspectFit"></image>
				<view v-else class="proof-empty">
					<text class="proof-plus">+</text>
					<text class="proof-label">上传截图</text>
				</view>
			</view>
		</view>

		<view class="remark-card">
			<text class="card-title">备注 (选填)</text>
			<input class="remark-input" v-model="remark" placeholder="转账备注 / 支付流水号" />
		</view>

		<view style="height: 80px; flex-shrink: 0;"></view>
		<view class="submit-btn" @click="submitDeposit">
			<text class="submit-text">提交入金申请</text>
		</view>
		<view class="bottom-space"></view>
	</view>
</template>

<script setup lang="ts">
	import CustomNavBar from '@/components/CustomNavBar.vue'
	import { ref, reactive } from 'vue'
	import { onLoad } from '@dcloudio/uni-app'
	import { get, post } from '@/utils/request.uts'

	type PayConfig = {
		minDepositAmount : number
		wechatPayQrcode : string
		alipayPayQrcode : string
		usdtTrc20Address : string
		usdtTrc20Qrcode : string
	}

	type MethodOption = { label : string; value : string }

	const methods : MethodOption[] = [
		{ label: '微信支付', value: 'wechat' } as MethodOption,
		{ label: '支付宝', value: 'alipay' } as MethodOption,
		{ label: 'USDT', value: 'usdt' } as MethodOption,
	]

	const selectedMethod = ref('wechat')
	const amount = ref('')
	const remark = ref('')
	const proofImage = ref('')
	const payConfig = reactive({
		minDepositAmount: 100,
		wechatPayQrcode: '',
		alipayPayQrcode: '',
		usdtTrc20Address: '',
		usdtTrc20Qrcode: '',
	} as PayConfig)

	function getQrcodeTitle() : string {
		if (selectedMethod.value == 'wechat') return '微信收款码'
		if (selectedMethod.value == 'alipay') return '支付宝收款码'
		return 'USDT 收款码'
	}

	function getCurrentQrcode() : string {
		if (selectedMethod.value == 'wechat') return payConfig.wechatPayQrcode
		if (selectedMethod.value == 'alipay') return payConfig.alipayPayQrcode
		return payConfig.usdtTrc20Qrcode
	}

	function loadConfig() {
		get('/api/mobile/fund/payment-config').then((res) => {
			if (res.code == 200 && res.data != null) {
				const d = res.data as any
				payConfig.minDepositAmount = (d['minDepositAmount'] as number) ?? 100
				payConfig.wechatPayQrcode = (d['wechatPayQrcode'] as string) ?? ''
				payConfig.alipayPayQrcode = (d['alipayPayQrcode'] as string) ?? ''
				payConfig.usdtTrc20Address = (d['usdtTrc20Address'] as string) ?? ''
				payConfig.usdtTrc20Qrcode = (d['usdtTrc20Qrcode'] as string) ?? ''
			}
		})
	}

	function chooseProof() {
		uni.chooseImage({
			count: 1,
			sizeType: ['compressed'],
			success: (chooseRes) => {
				const tempPath = chooseRes.tempFilePaths[0]
				const token = uni.getStorageSync('token') as string
				uni.showLoading({ title: '上传中...' })
				uni.uploadFile({
					url: '/api/mobile/fund/upload-qrcode',
					filePath: tempPath,
					name: 'file',
					header: { 'Authorization': `Bearer ${token}` },
					success: (uploadRes) => {
						uni.hideLoading()
						const data = JSON.parse(uploadRes.data as string)
						if (data != null && (data!['code'] as number) == 200) {
							const d = data!['data'] as any
							proofImage.value = (d['url'] as string) ?? ''
							uni.showToast({ title: '上传成功', icon: 'success' })
						} else {
							uni.showToast({ title: '上传失败', icon: 'none' })
						}
					},
					fail: (_e) => {
						uni.hideLoading()
						uni.showToast({ title: '上传失败', icon: 'none' })
					}
				})
			}
		})
	}

	function submitDeposit() {
		const amt = parseFloat(amount.value)
		if (isNaN(amt) || amt < payConfig.minDepositAmount) {
			uni.showToast({ title: `最低入金 $${payConfig.minDepositAmount}`, icon: 'none' })
			return
		}
		const submitData = {
			amount: amt,
			paymentMethod: selectedMethod.value,
			remark: remark.value,
		} as any
		if (proofImage.value.length > 0) {
			submitData['proofImage'] = proofImage.value
		}
		post('/api/mobile/fund/deposit', submitData).then((res) => {
			if (res.code == 201) {
				uni.showToast({ title: '入金申请已提交', icon: 'success' })
				setTimeout(() => { uni.navigateBack({}) }, 1500)
			} else {
				uni.showToast({ title: res.msg, icon: 'none' })
			}
		})
	}

	onLoad(() => { loadConfig() })
</script>

<style>
	.deposit-page {
		flex: 1;
		background-color: var(--color-bg-page);
		padding: var(--spacing-lg);
	}

	.card-title {
		font-size: var(--font-md);
		font-weight: 700;
		color: var(--color-text-primary);
		margin-bottom: var(--spacing-md);
	}

	.card-subtitle {
		font-size: var(--font-xs);
		color: var(--color-text-muted);
		margin-top: -8px;
		margin-bottom: var(--spacing-md);
	}

	.method-card {
		background-color: var(--color-bg-card);
		border-radius: var(--radius-xl);
		padding: var(--spacing-xl);
		margin-bottom: var(--spacing-md);
		box-shadow: var(--shadow-card);
	}

	.method-row {
		flex-direction: row;
		gap: var(--spacing-sm);
	}

	.method-pill {
		flex: 1;
		align-items: center;
		justify-content: center;
		padding: var(--spacing-md) var(--spacing-sm);
		border-radius: var(--radius-pill);
		background-color: var(--color-bg-section);
		border-width: 2px;
		border-style: solid;
		border-color: var(--color-border-light);
		transition: all var(--transition-fast);
	}

	.method-pill-active {
		border-color: var(--color-primary);
		background-color: var(--color-primary-bg);
	}

	.method-pill-text {
		font-size: var(--font-sm);
		color: var(--color-text-secondary);
		font-weight: 500;
	}

	.method-pill-text-active {
		color: var(--color-primary);
		font-weight: 700;
	}

	.amount-card {
		background-color: var(--color-bg-card);
		border-radius: var(--radius-xl);
		padding: var(--spacing-xl);
		margin-bottom: var(--spacing-md);
		box-shadow: var(--shadow-card);
	}

	.amount-row {
		flex-direction: row;
		align-items: center;
		border-bottom-width: 2px;
		border-bottom-style: solid;
		border-bottom-color: var(--color-primary);
		padding-bottom: var(--spacing-sm);
	}

	.amount-sign {
		font-size: var(--font-3xl);
		font-weight: 700;
		color: var(--color-primary);
		margin-right: var(--spacing-sm);
	}

	.amount-input {
		flex: 1;
		font-size: var(--font-3xl);
		color: var(--color-text-primary);
		font-weight: 600;
	}

	.amount-hint {
		font-size: var(--font-xs);
		color: var(--color-text-muted);
		margin-top: var(--spacing-sm);
	}

	.qrcode-card {
		background-color: var(--color-bg-card);
		border-radius: var(--radius-xl);
		padding: var(--spacing-xl);
		margin-bottom: var(--spacing-md);
		box-shadow: var(--shadow-card);
	}

	.qrcode-display {
		align-items: center;
		margin-bottom: var(--spacing-md);
	}

	.qrcode-box {
		width: 220px;
		height: 220px;
		border-radius: var(--radius-lg);
		border-width: 1px;
		border-style: solid;
		border-color: var(--color-border);
		padding: var(--spacing-md);
		background-color: #FFFFFF;
		align-items: center;
		justify-content: center;
	}

	.qrcode-image {
		width: 190px;
		height: 190px;
	}

	.qrcode-empty {
		width: 220px;
		height: 180px;
		border-radius: var(--radius-lg);
		border-width: 2px;
		border-style: dashed;
		border-color: var(--color-border);
		background-color: var(--color-bg-section);
		align-items: center;
		justify-content: center;
	}

	.qrcode-empty-icon {
		width: 40px;
		height: 40px;
		margin-bottom: var(--spacing-sm);
	}

	.qrcode-empty-text {
		font-size: var(--font-sm);
		color: var(--color-text-muted);
		font-weight: 500;
		margin-bottom: var(--spacing-xs);
	}

	.qrcode-empty-hint {
		font-size: var(--font-xs);
		color: var(--color-text-placeholder);
	}

	.address-section {
		margin-top: var(--spacing-md);
		padding-top: var(--spacing-md);
		border-top-width: 1px;
		border-top-style: solid;
		border-top-color: var(--color-divider);
	}

	.address-label {
		font-size: var(--font-xs);
		color: var(--color-text-muted);
		font-weight: 600;
		margin-bottom: var(--spacing-sm);
	}

	.address-box {
		background-color: var(--color-bg-section);
		padding: var(--spacing-md);
		border-radius: var(--radius-md);
		border-width: 1px;
		border-style: solid;
		border-color: var(--color-border-light);
	}

	.address-value {
		font-size: var(--font-sm);
		color: var(--color-text-secondary);
		word-break: break-all;
		line-height: 20px;
		font-family: 'SF Mono', 'Roboto Mono', monospace;
	}

	.proof-card {
		background-color: var(--color-bg-card);
		border-radius: var(--radius-xl);
		padding: var(--spacing-xl);
		margin-bottom: var(--spacing-md);
		box-shadow: var(--shadow-card);
	}

	.proof-upload {
		width: 100px;
		height: 100px;
		border-radius: var(--radius-lg);
		border-width: 2px;
		border-style: dashed;
		border-color: var(--color-border);
		justify-content: center;
		align-items: center;
		overflow: hidden;
		background-color: var(--color-bg-section);
	}

	.proof-img {
		width: 100px;
		height: 100px;
	}

	.proof-empty {
		align-items: center;
	}

	.proof-plus {
		font-size: 28px;
		color: var(--color-text-muted);
		line-height: 1;
	}

	.proof-label {
		font-size: var(--font-xs);
		color: var(--color-text-muted);
		margin-top: var(--spacing-xs);
	}

	.remark-card {
		background-color: var(--color-bg-card);
		border-radius: var(--radius-xl);
		padding: var(--spacing-xl);
		margin-bottom: var(--spacing-xl);
		box-shadow: var(--shadow-card);
	}

	.remark-input {
		font-size: var(--font-base);
		color: var(--color-text-primary);
		padding: var(--spacing-md);
		background-color: var(--color-bg-section);
		border-radius: var(--radius-md);
		border-width: 1px;
		border-style: solid;
		border-color: var(--color-border-light);
	}

	.submit-btn {
		background: var(--gradient-primary);
		border-radius: var(--radius-lg);
		padding: var(--spacing-lg) var(--spacing-xl);
		align-items: center;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
		position: fixed;
		bottom: 16px;
		left: 16px;
		right: 16px;
		z-index: 99;
	}

	.submit-btn:active {
		opacity: 0.85;
		transform: scale(0.98);
	}

	.submit-text {
		font-size: var(--font-lg);
		font-weight: 700;
		color: var(--color-text-inverse);
		letter-spacing: 2px;
	}

	.bottom-space {
		height: 20px;
	}
</style>
