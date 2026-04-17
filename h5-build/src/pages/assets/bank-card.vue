<template>
	<view class="bankcard-page">
		<CustomNavBar title="收款账户" />
		<scroll-view class="cards-scroll" direction="vertical">
			<view v-for="(card, idx) in cards" :key="idx" class="card-item">
				<view class="card-header">
					<text class="card-type">{{getTypeText(card.card_type)}}</text>
					<text v-if="card.is_default == 1" class="default-badge">默认</text>
				</view>
				<view class="card-body">
					<text class="card-name" v-if="card.account_name != ''">{{card.account_name}}</text>
					<text class="card-no">{{card.account_no}}</text>
				</view>
				<view class="card-actions">
					<view v-if="card.is_default != 1" class="card-btn" @click="setDefault(card.id)">
						<text class="btn-text">设为默认</text>
					</view>
					<view class="card-btn card-btn-danger" @click="removeCard(card.id)">
						<text class="btn-text btn-text-danger">删除</text>
					</view>
				</view>
			</view>
			<view v-if="cards.length == 0" class="empty-view">
				<text class="empty-text">暂无收款账户</text>
			</view>
		</scroll-view>

		<view class="add-section">
			<text class="section-title">添加收款账户</text>
			<view class="form-group">
				<text class="form-label">账户类型</text>
				<view class="type-row">
					<view v-for="(t, idx) in typeOptions" :key="idx" class="type-item"
						:class="{'type-active': newCard.cardType == t.value}" @click="newCard.cardType = t.value">
						<text class="type-text" :class="{'type-text-active': newCard.cardType == t.value}">{{t.label}}</text>
					</view>
				</view>
			</view>
			<view class="form-group">
				<text class="form-label">账户名称/备注</text>
				<input class="form-input" v-model="newCard.accountName" placeholder="请输入名称" />
			</view>
			<view class="form-group">
				<text class="form-label">{{newCard.cardType == 'usdt' ? 'USDT-TRC20 地址' : '账号'}}</text>
				<input class="form-input" v-model="newCard.accountNo"
					:placeholder="newCard.cardType == 'usdt' ? '请输入TRC20地址' : '请输入账号'" />
			</view>
			<view class="form-group" v-if="newCard.cardType != 'usdt'">
				<text class="form-label">收款二维码（选填）</text>
				<view class="qrcode-upload" @click="chooseQrcode">
					<image v-if="qrcodeUrl != ''" :src="qrcodeUrl" class="qrcode-preview" mode="aspectFit" />
					<view v-else class="qrcode-placeholder">
						<text class="qrcode-plus">+</text>
						<text class="qrcode-hint">上传二维码</text>
					</view>
				</view>
			</view>
			<view style="height: 80px; flex-shrink: 0;"></view>
			<view class="add-btn" @click="addCard">
				<text class="add-btn-text">添加</text>
			</view>
		</view>
	</view>
</template>

<script setup lang="ts">
	import CustomNavBar from '@/components/CustomNavBar.vue'
	import { ref, reactive } from 'vue'
	import { onShow } from '@dcloudio/uni-app'
	import { get, post, put, del } from '@/utils/request.uts'

	type BankCard = {
		id : number
		card_type : string
		account_name : string
		account_no : string
		is_default : number
	}

	type NewCardForm = {
		cardType : string
		accountName : string
		accountNo : string
	}

	type TypeOption = {
		label : string
		value : string
	}

	const typeOptions : TypeOption[] = [
		{ label: '微信', value: 'wechat' } as TypeOption,
		{ label: '支付宝', value: 'alipay' } as TypeOption,
		{ label: 'USDT', value: 'usdt' } as TypeOption,
	]

	const cards = ref([] as BankCard[])
	const newCard = reactive({ cardType: 'wechat', accountName: '', accountNo: '' } as NewCardForm)
	const qrcodeUrl = ref('')

	function getTypeText(t : string) : string {
		if (t == 'wechat') return '微信'
		if (t == 'alipay') return '支付宝'
		if (t == 'usdt') return 'USDT-TRC20'
		return t
	}

	function loadCards() {
		get('/api/mobile/fund/bank-cards').then((res) => {
			if (res.code == 200 && res.data != null) {
				const list = res.data as any[]
				cards.value = list.map((item : any) : BankCard => {
					return {
						id: (item['id'] as number) ?? 0,
						card_type: (item['card_type'] as string) ?? '',
						account_name: (item['account_name'] as string) ?? '',
						account_no: (item['account_no'] as string) ?? '',
						is_default: (item['is_default'] as number) ?? 0,
					} as BankCard
				})
			}
		})
	}

	function chooseQrcode() {
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
							qrcodeUrl.value = (d['url'] as string) ?? ''
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

	function addCard() {
		if (newCard.accountNo.length == 0) {
			uni.showToast({ title: '请输入账号', icon: 'none' })
			return
		}
		const data = {
			cardType: newCard.cardType,
			accountName: newCard.accountName,
			accountNo: newCard.accountNo,
		} as any
		if (qrcodeUrl.value.length > 0) {
			data['qrcodeImage'] = qrcodeUrl.value
		}
		post('/api/mobile/fund/bank-cards', data).then((res) => {
			if (res.code == 201) {
				uni.showToast({ title: '添加成功', icon: 'success' })
				newCard.accountName = ''
				newCard.accountNo = ''
				qrcodeUrl.value = ''
				loadCards()
			} else {
				uni.showToast({ title: res.msg, icon: 'none' })
			}
		})
	}

	function setDefault(id : number) {
		put(`/api/mobile/fund/bank-cards/${id}/default`).then((res) => {
			if (res.code == 200) {
				uni.showToast({ title: '已设为默认', icon: 'success' })
				loadCards()
			}
		})
	}

	function removeCard(id : number) {
		uni.showModal({
			title: '确认删除',
			content: '确定要删除这个收款账户吗？',
			success: (result) => {
				if (result.confirm) {
					del(`/api/mobile/fund/bank-cards/${id}`).then((res) => {
						if (res.code == 200) {
							uni.showToast({ title: '已删除', icon: 'success' })
							loadCards()
						}
					})
				}
			}
		})
	}

	onShow(() => { loadCards() })
</script>

<style>
	.bankcard-page {
		flex: 1;
		background-color: var(--color-bg-page);
		padding: var(--spacing-lg);
	}

	.cards-scroll {
		max-height: 300px;
		margin-bottom: var(--spacing-lg);
	}

	.card-item {
		background-color: var(--color-bg-card);
		border-radius: var(--radius-lg);
		padding: var(--spacing-lg);
		margin-bottom: var(--spacing-md);
		box-shadow: var(--shadow-card);
		border-left-width: 4px;
		border-left-style: solid;
		border-left-color: var(--color-primary);
	}

	.card-header {
		flex-direction: row;
		align-items: center;
		margin-bottom: var(--spacing-sm);
	}

	.card-type {
		font-size: var(--font-base);
		font-weight: 700;
		color: var(--color-text-primary);
		margin-right: var(--spacing-sm);
	}

	.default-badge {
		font-size: var(--font-xs);
		color: var(--color-primary);
		background-color: var(--color-primary-bg);
		padding: 2px var(--spacing-sm);
		border-radius: var(--radius-sm);
		font-weight: 600;
	}

	.card-body {
		margin-bottom: var(--spacing-md);
		padding-bottom: var(--spacing-md);
		border-bottom-width: 1px;
		border-bottom-style: solid;
		border-bottom-color: var(--color-divider);
	}

	.card-name {
		font-size: var(--font-sm);
		color: var(--color-text-secondary);
		margin-bottom: var(--spacing-xs);
	}

	.card-no {
		font-size: var(--font-sm);
		color: var(--color-text-muted);
		letter-spacing: 0.5px;
	}

	.card-actions {
		flex-direction: row;
		justify-content: flex-end;
	}

	.card-btn {
		padding: var(--spacing-sm) var(--spacing-lg);
		border-radius: var(--radius-sm);
		background-color: var(--color-bg-section);
		margin-left: var(--spacing-md);
		border-width: 1px;
		border-style: solid;
		border-color: var(--color-border-light);
		transition: all var(--transition-fast);
	}

	.card-btn-danger {
		background-color: var(--color-danger-bg);
		border-color: rgba(239, 68, 68, 0.15);
	}

	.btn-text {
		font-size: var(--font-sm);
		color: var(--color-primary);
		font-weight: 500;
	}

	.btn-text-danger {
		color: var(--color-danger);
	}

	.add-section {
		background-color: var(--color-bg-card);
		border-radius: var(--radius-lg);
		padding: var(--spacing-xl) var(--spacing-lg);
		box-shadow: var(--shadow-card);
	}

	.section-title {
		font-size: var(--font-md);
		font-weight: 700;
		color: var(--color-text-primary);
		margin-bottom: var(--spacing-xl);
	}

	.form-group {
		margin-bottom: var(--spacing-xl);
	}

	.form-label {
		font-size: var(--font-sm);
		color: var(--color-text-secondary);
		margin-bottom: var(--spacing-sm);
		font-weight: 500;
	}

	.form-input {
		font-size: var(--font-base);
		color: var(--color-text-primary);
		padding: var(--spacing-md);
		background-color: var(--color-bg-input);
		border-radius: var(--radius-md);
		border-width: 1px;
		border-style: solid;
		border-color: var(--color-border);
		transition: border-color var(--transition-fast);
	}

	.type-row {
		flex-direction: row;
	}

	.type-item {
		padding: var(--spacing-sm) var(--spacing-xl);
		border-radius: var(--radius-pill);
		background-color: var(--color-bg-section);
		margin-right: var(--spacing-md);
		border-width: 2px;
		border-style: solid;
		border-color: var(--color-border-light);
		transition: all var(--transition-fast);
	}

	.type-active {
		background-color: var(--color-primary-bg);
		border-color: var(--color-primary);
	}

	.type-text {
		font-size: var(--font-sm);
		color: var(--color-text-secondary);
		font-weight: 500;
	}

	.type-text-active {
		color: var(--color-primary);
		font-weight: 600;
	}

	.add-btn {
		background: var(--gradient-primary);
		border-radius: var(--radius-lg);
		padding: var(--spacing-md);
		align-items: center;
		margin-top: var(--spacing-sm);
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
		transition: opacity var(--transition-fast);
		position: fixed;
		bottom: 16px;
		left: 16px;
		right: 16px;
		z-index: 99;
	}

	.add-btn-text {
		font-size: var(--font-base);
		font-weight: 700;
		color: var(--color-text-inverse);
		letter-spacing: 1px;
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

	.empty-view {
		padding: var(--spacing-3xl) 0;
		align-items: center;
	}

	.empty-text {
		font-size: var(--font-sm);
		color: var(--color-text-muted);
	}
</style>
