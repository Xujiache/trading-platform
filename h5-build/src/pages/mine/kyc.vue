<template>
	<scroll-view class="kyc-page" direction="vertical">
		<CustomNavBar title="实名认证" />
		<view class="status-card" v-if="kycStatus != 'none'">
			<text class="status-label">认证状态</text>
			<text :class="'status-value status-' + kycStatus">{{statusText}}</text>
			<text class="reject-reason" v-if="kycStatus == 'rejected' && rejectReason.length > 0">驳回原因: {{rejectReason}}</text>
		</view>

		<view class="form-section" v-if="kycStatus == 'none' || kycStatus == 'rejected'">
			<text class="form-title">实名认证</text>

			<view class="form-item">
				<text class="label">真实姓名</text>
				<input class="input" v-model="realName" placeholder="请输入真实姓名" />
			</view>

			<view class="form-item">
				<text class="label">证件号码</text>
				<input class="input" v-model="idCard" placeholder="请输入证件号码" />
			</view>

			<view class="form-item">
				<text class="label">证件正面</text>
				<view class="upload-area" @click="chooseImage('front')">
					<image v-if="frontImage.length > 0" :src="frontImage" class="preview-img" mode="aspectFit" />
					<text v-else class="upload-text">+ 点击上传</text>
				</view>
			</view>

			<view class="form-item">
				<text class="label">证件反面</text>
				<view class="upload-area" @click="chooseImage('back')">
					<image v-if="backImage.length > 0" :src="backImage" class="preview-img" mode="aspectFit" />
					<text v-else class="upload-text">+ 点击上传</text>
				</view>
			</view>

			<view class="form-item">
				<text class="label">人脸照片</text>
				<view class="upload-area" @click="chooseImage('face')">
					<image v-if="faceImage.length > 0" :src="faceImage" class="preview-img" mode="aspectFit" />
					<text v-else class="upload-text">+ 点击上传</text>
				</view>
			</view>

			<view style="height: 80px; flex-shrink: 0;"></view>
			<view class="submit-btn" @click="submitKyc">
				<text class="submit-text">提交认证</text>
			</view>
		</view>

		<view class="info-section" v-if="kycStatus == 'approved'">
			<text class="info-label">姓名: {{realName}}</text>
			<text class="info-label">证件号: {{idCard}}</text>
		</view>

		<view class="pending-section" v-if="kycStatus == 'pending'">
			<text class="pending-text">您的认证资料已提交，请耐心等待审核</text>
		</view>
	</scroll-view>
</template>

<script setup lang="ts">
	import CustomNavBar from '@/components/CustomNavBar.vue'
	import { ref, computed } from 'vue'
	import { onLoad } from '@dcloudio/uni-app'
	import { get, post } from '../../utils/request.uts'

	const kycStatus = ref('none')
	const rejectReason = ref('')
	const realName = ref('')
	const idCard = ref('')
	const frontImage = ref('')
	const backImage = ref('')
	const faceImage = ref('')

	const statusText = computed(() : string => {
		if (kycStatus.value == 'pending') return '审核中'
		if (kycStatus.value == 'approved') return '已通过'
		if (kycStatus.value == 'rejected') return '已驳回'
		return '未认证'
	})

	onLoad(() => { loadStatus() })

	function loadStatus() {
		get('/api/mobile/user/kyc/status').then((res) => {
			if (res.code == 200 && res.data != null) {
				const d = res.data as any
				kycStatus.value = (d['kyc_status'] as string) ?? 'none'
				rejectReason.value = (d['kyc_reject_reason'] as string) ?? ''
				realName.value = (d['real_name'] as string) ?? ''
				idCard.value = (d['id_card'] as string) ?? ''
				frontImage.value = (d['kyc_front_image'] as string) ?? ''
				backImage.value = (d['kyc_back_image'] as string) ?? ''
				faceImage.value = (d['kyc_face_image'] as string) ?? ''
			}
		}).catch((_e) => {})
	}

	function chooseImage(type : string) {
		uni.chooseImage({
			count: 1,
			success: (res) => {
				const path = res.tempFilePaths[0]
				uni.uploadFile({
					url: '/api/mobile/user/kyc/upload',
					filePath: path,
					name: 'file',
					header: { 'Authorization': `Bearer ${uni.getStorageSync('token') as string}` },
					success: (uploadRes) => {
						const data = JSON.parse(uploadRes.data)
						if (data != null) {
							const d = data!['data'] as any
							if (d != null) {
								const url = (d!['url'] as string) ?? ''
								if (type == 'front') frontImage.value = url
								else if (type == 'back') backImage.value = url
								else faceImage.value = url
							}
						}
					}
				})
			}
		})
	}

	function submitKyc() {
		if (realName.value.length == 0 || idCard.value.length == 0) {
			uni.showToast({ title: '请填写姓名和证件号', icon: 'none' }); return
		}
		if (frontImage.value.length == 0 || backImage.value.length == 0 || faceImage.value.length == 0) {
			uni.showToast({ title: '请上传所有证件照片', icon: 'none' }); return
		}
		post('/api/mobile/user/kyc/submit', {
			real_name: realName.value, id_card: idCard.value,
			front_image: frontImage.value, back_image: backImage.value, face_image: faceImage.value
		} as any).then((res) => {
			if (res.code == 200 || res.code == 201) {
				uni.showToast({ title: '提交成功', icon: 'success' })
				kycStatus.value = 'pending'
			} else {
				uni.showToast({ title: res.msg, icon: 'none' })
			}
		}).catch((_e) => {})
	}
</script>

<style>
	.kyc-page {
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

	.status-value {
		font-size: var(--font-xl);
		font-weight: 700;
	}

	.status-pending {
		color: var(--color-warning);
	}

	.status-approved {
		color: var(--color-success);
	}

	.status-rejected {
		color: var(--color-danger);
	}

	.reject-reason {
		font-size: var(--font-sm);
		color: var(--color-danger);
		margin-top: var(--spacing-sm);
		background-color: var(--color-danger-bg);
		padding: var(--spacing-sm) var(--spacing-md);
		border-radius: var(--radius-sm);
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
		margin-bottom: var(--spacing-xl);
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

	.upload-area {
		width: 200px;
		height: 130px;
		border-width: 2px;
		border-style: dashed;
		border-color: var(--color-border);
		border-radius: var(--radius-md);
		justify-content: center;
		align-items: center;
		background-color: var(--color-bg-section);
		transition-property: border-color;
		transition-duration: var(--transition-fast);
	}

	.upload-text {
		font-size: var(--font-sm);
		color: var(--color-text-muted);
	}

	.preview-img {
		width: 196px;
		height: 126px;
		border-radius: var(--radius-sm);
	}

	.submit-btn {
		margin-top: var(--spacing-2xl);
		padding: var(--spacing-lg);
		background: var(--gradient-primary);
		border-radius: var(--radius-md);
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

	.info-section {
		margin: var(--spacing-lg);
		padding: var(--spacing-2xl);
		background-color: var(--color-bg-card);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-card);
	}

	.info-label {
		font-size: var(--font-md);
		color: var(--color-text-primary);
		margin-bottom: var(--spacing-md);
		font-weight: 500;
	}

	.pending-section {
		margin: var(--spacing-lg);
		padding: 40px var(--spacing-2xl);
		background-color: var(--color-warning-bg);
		border-radius: var(--radius-lg);
		align-items: center;
		border-width: 1px;
		border-style: solid;
		border-color: var(--color-warning);
	}

	.pending-text {
		font-size: var(--font-lg);
		color: var(--color-warning);
		font-weight: 600;
	}
</style>
