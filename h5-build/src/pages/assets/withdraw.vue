<template>
	<view class="withdraw-page">
		<CustomNavBar title="出金" />
		<view class="balance-card">
			<text class="balance-label">可用余额(实盘)</text>
			<text class="balance-value">${{formatMoney(availableBalance)}}</text>
		</view>

		<view class="method-section">
			<text class="section-title">出金方式</text>
			<view class="method-list">
				<view v-for="(m, idx) in methods" :key="idx" class="method-item"
					:class="{'method-active': selectedMethod == m.value}" @click="selectedMethod = m.value">
					<text class="method-name">{{m.label}}</text>
					<view v-if="selectedMethod == m.value" class="method-check">
						<text class="check-icon">✓</text>
					</view>
				</view>
			</view>
		</view>

		<view class="card-section" v-if="filteredCards.length > 0">
			<text class="section-title">选择收款账户</text>
			<view v-for="(card, idx) in filteredCards" :key="idx" class="card-item"
				:class="{'card-active': selectedCardId == card.id}" @click="selectCard(card)">
				<text class="card-name">{{card.account_name || card.account_no}}</text>
				<text v-if="card.is_default == 1" class="default-tag">默认</text>
			</view>
		</view>

		<view class="amount-section">
			<text class="section-title">出金金额</text>
			<view class="amount-input-wrap">
				<text class="currency-symbol">$</text>
				<input class="amount-input" type="digit" v-model="amount" placeholder="请输入出金金额"
					@input="onAmountChange" />
			</view>
			<view class="fee-info">
				<text class="fee-text" v-if="false">手续费: ${{formatMoney(fee)}}</text>
				<text class="fee-text">实际到账: ${{formatMoney(actualAmount)}}</text>
			</view>
		</view>

		<view class="qrcode-section">
			<text class="section-title">收款二维码（选填）</text>
			<view class="qrcode-upload" @click="uploadQrcode">
				<image v-if="qrcodeImage != ''" :src="qrcodeImage" class="qrcode-preview" mode="aspectFit" />
				<view v-else class="qrcode-placeholder">
					<text class="qrcode-plus">+</text>
					<text class="qrcode-hint">上传二维码</text>
				</view>
			</view>
		</view>

		<view class="remark-section">
			<text class="section-title">备注(选填)</text>
			<input class="remark-input" v-model="remark" placeholder="出金备注" />
		</view>

		<view style="height: 80px; flex-shrink: 0;"></view>
		<view class="submit-btn" @click="submitWithdraw">
			<text class="submit-text">提交出金申请</text>
		</view>
	</view>
</template>

<script setup lang="ts">
	import CustomNavBar from '@/components/CustomNavBar.vue'
	import { ref, computed } from 'vue'
	import { onLoad } from '@dcloudio/uni-app'
	import { get, post } from '@/utils/request.uts'

	type MethodOption = {
		label : string
		value : string
	}

	type BankCard = {
		id : number
		card_type : string
		account_name : string
		account_no : string
		is_default : number
	}

	const methods : MethodOption[] = [
		{ label: '微信', value: 'wechat' } as MethodOption,
		{ label: '支付宝', value: 'alipay' } as MethodOption,
		{ label: 'USDT', value: 'usdt' } as MethodOption,
	]

	const selectedMethod = ref('wechat')
	const amount = ref('')
	const remark = ref('')
	const fee = ref(0.0)
	const actualAmount = ref(0.0)
	const availableBalance = ref(0.0)
	const bankCards = ref([] as BankCard[])
	const selectedCardId = ref(0)
	const qrcodeImage = ref('')

	const filteredCards = computed(() : BankCard[] => {
		return bankCards.value.filter((c : BankCard) : boolean => c.card_type == selectedMethod.value)
	})

	function formatMoney(val : number) : string {
		return val.toFixed(2)
	}

	function selectCard(card : BankCard) {
		selectedCardId.value = card.id
	}

	function onAmountChange() {
		const amt = parseFloat(amount.value)
		if (isNaN(amt) || amt <= 0) {
			fee.value = 0
			actualAmount.value = 0
			return
		}
		get(`/api/mobile/fund/withdraw-fee?amount=${amt}`).then((res) => {
			if (res.code == 200 && res.data != null) {
				const d = res.data as any
				fee.value = (d['fee'] as number) ?? 0
				actualAmount.value = (d['actualAmount'] as number) ?? 0
			}
		})
	}

	function loadData() {
		get('/api/mobile/fund/account?accountType=real').then((res) => {
			if (res.code == 200 && res.data != null) {
				const d = res.data as any
				availableBalance.value = (d['availableMargin'] as number) ?? 0
			}
		})
		get('/api/mobile/fund/bank-cards').then((res) => {
			if (res.code == 200 && res.data != null) {
				const list = res.data as any[]
				bankCards.value = list.map((item : any) : BankCard => {
					return {
						id: (item['id'] as number) ?? 0,
						card_type: (item['card_type'] as string) ?? '',
						account_name: (item['account_name'] as string) ?? '',
						account_no: (item['account_no'] as string) ?? '',
						is_default: (item['is_default'] as number) ?? 0,
					} as BankCard
				})
				const defaultCard = bankCards.value.find((c : BankCard) : boolean => c.is_default == 1)
				if (defaultCard != null) {
					selectedCardId.value = defaultCard.id
				}
			}
		})
	}

	function uploadQrcode() {
		uni.chooseImage({
			count: 1,
			sizeType: ['compressed'],
			success: (chooseRes) => {
				const tempPath = chooseRes.tempFilePaths[0]
				const token = uni.getStorageSync('token') as string
				uni.uploadFile({
					url: '/api/mobile/fund/upload-qrcode',
					filePath: tempPath,
					name: 'file',
					header: { 'Authorization': `Bearer ${token}` },
					success: (uploadRes) => {
						const data = JSON.parse(uploadRes.data as string)
						if (data != null && (data!['code'] as number) == 200) {
							const d = data!['data'] as any
							qrcodeImage.value = (d['url'] as string) ?? ''
							uni.showToast({ title: '上传成功', icon: 'success' })
						}
					},
					fail: (_e) => {
						uni.showToast({ title: '上传失败', icon: 'none' })
					}
				})
			}
		})
	}

	function submitWithdraw() {
		const amt = parseFloat(amount.value)
		if (isNaN(amt) || amt <= 0) {
			uni.showToast({ title: '请输入出金金额', icon: 'none' })
			return
		}
		if (amt > availableBalance.value) {
			uni.showToast({ title: '可用余额不足', icon: 'none' })
			return
		}

		const card = bankCards.value.find((c : BankCard) : boolean => c.id == selectedCardId.value)

		const submitData = {
			amount: amt,
			withdrawMethod: selectedMethod.value,
			bankCardId: selectedCardId.value > 0 ? selectedCardId.value : null,
			accountName: card != null ? card.account_name : '',
			accountNo: card != null ? card.account_no : '',
			remark: remark.value,
		} as any
		if (qrcodeImage.value.length > 0) {
			submitData['qrcodeImage'] = qrcodeImage.value
		}
		post('/api/mobile/fund/withdraw', submitData).then((res) => {
			if (res.code == 201) {
				uni.showToast({ title: '出金申请已提交', icon: 'success' })
				setTimeout(() => { uni.navigateBack({}) }, 1500)
			} else {
				uni.showToast({ title: res.msg, icon: 'none' })
			}
		})
	}

	onLoad(() => { loadData() })
</script>

<style>
	.withdraw-page {
		flex: 1;
		background-color: var(--color-bg-page);
		padding: var(--spacing-lg);
	}

	.balance-card {
		background: var(--gradient-gold);
		border-radius: var(--radius-lg);
		padding: var(--spacing-xl);
		margin-bottom: var(--spacing-lg);
		box-shadow: var(--shadow-lg);
	}

	.balance-label {
		font-size: var(--font-sm);
		color: rgba(255, 255, 255, 0.75);
		margin-bottom: var(--spacing-sm);
		letter-spacing: 0.3px;
	}

	.balance-value {
		font-size: var(--font-4xl);
		font-weight: 700;
		color: var(--color-text-inverse);
		letter-spacing: -0.5px;
	}

	.section-title {
		font-size: var(--font-base);
		font-weight: 700;
		color: var(--color-text-primary);
		margin-bottom: var(--spacing-md);
	}

	.method-section {
		background-color: var(--color-bg-card);
		border-radius: var(--radius-lg);
		padding: var(--spacing-lg);
		margin-bottom: var(--spacing-lg);
		box-shadow: var(--shadow-card);
	}

	.method-list {
		flex-direction: row;
	}

	.method-item {
		flex: 1;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		padding: var(--spacing-md) var(--spacing-sm);
		margin: 0 var(--spacing-xs);
		border-radius: var(--radius-pill);
		background-color: var(--color-bg-section);
		border-width: 2px;
		border-style: solid;
		border-color: var(--color-border-light);
		transition: all var(--transition-fast);
	}

	.method-active {
		border-color: var(--color-primary);
		background-color: var(--color-primary-bg);
	}

	.method-name {
		font-size: var(--font-sm);
		color: var(--color-text-primary);
		font-weight: 500;
	}

	.method-check {
		width: 20px;
		height: 20px;
		border-radius: 10px;
		background: var(--gradient-primary);
		align-items: center;
		justify-content: center;
		margin-left: var(--spacing-xs);
	}

	.check-icon {
		font-size: var(--font-xs);
		color: var(--color-text-inverse);
		font-weight: 700;
	}

	.card-section {
		background-color: var(--color-bg-card);
		border-radius: var(--radius-lg);
		padding: var(--spacing-lg);
		margin-bottom: var(--spacing-lg);
		box-shadow: var(--shadow-card);
	}

	.card-item {
		flex-direction: row;
		align-items: center;
		padding: var(--spacing-md);
		border-radius: var(--radius-md);
		background-color: var(--color-bg-section);
		margin-bottom: var(--spacing-sm);
		border-width: 2px;
		border-style: solid;
		border-color: var(--color-border-light);
		transition: all var(--transition-fast);
	}

	.card-active {
		border-color: var(--color-primary);
		background-color: var(--color-primary-bg);
	}

	.card-name {
		flex: 1;
		font-size: var(--font-sm);
		color: var(--color-text-primary);
		font-weight: 500;
	}

	.default-tag {
		font-size: var(--font-xs);
		color: var(--color-primary);
		background-color: var(--color-primary-bg);
		padding: 2px var(--spacing-sm);
		border-radius: var(--radius-sm);
		font-weight: 600;
	}

	.amount-section {
		background-color: var(--color-bg-card);
		border-radius: var(--radius-lg);
		padding: var(--spacing-xl) var(--spacing-lg);
		margin-bottom: var(--spacing-lg);
		box-shadow: var(--shadow-card);
	}

	.amount-input-wrap {
		flex-direction: row;
		align-items: center;
		border-bottom-width: 2px;
		border-bottom-style: solid;
		border-bottom-color: var(--color-border);
		padding-bottom: var(--spacing-md);
	}

	.currency-symbol {
		font-size: var(--font-4xl);
		font-weight: 700;
		color: var(--color-text-primary);
		margin-right: var(--spacing-sm);
	}

	.amount-input {
		flex: 1;
		font-size: var(--font-4xl);
		color: var(--color-text-primary);
		font-weight: 600;
	}

	.fee-info {
		flex-direction: row;
		justify-content: space-between;
		margin-top: var(--spacing-md);
		padding: var(--spacing-sm) var(--spacing-md);
		background-color: var(--color-bg-section);
		border-radius: var(--radius-sm);
	}

	.fee-text {
		font-size: var(--font-sm);
		color: var(--color-text-secondary);
	}

	.remark-section {
		background-color: var(--color-bg-card);
		border-radius: var(--radius-lg);
		padding: var(--spacing-lg);
		margin-bottom: var(--spacing-3xl);
		box-shadow: var(--shadow-card);
	}

	.remark-input {
		font-size: var(--font-base);
		color: var(--color-text-primary);
		padding: var(--spacing-md) 0;
		border-bottom-width: 1px;
		border-bottom-style: solid;
		border-bottom-color: var(--color-border);
	}

	.qrcode-section {
		background-color: var(--color-bg-card);
		border-radius: var(--radius-lg);
		padding: var(--spacing-lg);
		margin-bottom: var(--spacing-lg);
		box-shadow: var(--shadow-card);
	}

	.qrcode-upload {
		width: 120px;
		height: 120px;
		border-radius: var(--radius-md);
		border-width: 2px;
		border-style: dashed;
		border-color: var(--color-border);
		justify-content: center;
		align-items: center;
		overflow: hidden;
		background-color: var(--color-bg-section);
	}

	.qrcode-preview {
		width: 120px;
		height: 120px;
	}

	.qrcode-placeholder {
		align-items: center;
	}

	.qrcode-plus {
		font-size: 30px;
		color: var(--color-text-muted);
	}

	.qrcode-hint {
		font-size: var(--font-xs);
		color: var(--color-text-muted);
		margin-top: var(--spacing-xs);
	}

	.submit-btn {
		background: var(--gradient-gold);
		border-radius: var(--radius-lg);
		padding: var(--spacing-lg);
		align-items: center;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
		transition: opacity var(--transition-fast);
		position: fixed;
		bottom: 16px;
		left: 16px;
		right: 16px;
		z-index: 99;
	}

	.submit-text {
		font-size: var(--font-md);
		font-weight: 700;
		color: var(--color-text-inverse);
		letter-spacing: 1px;
	}
</style>
