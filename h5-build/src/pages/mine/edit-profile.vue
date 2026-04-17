<template>
	<scroll-view class="profile-page" direction="vertical">
		<CustomNavBar title="编辑资料" />
		<view class="form-section">
			<view class="avatar-section" @click="chooseAvatar">
				<view class="avatar-circle">
					<image v-if="avatarUrl != ''" class="avatar-img" :src="avatarUrl" mode="aspectFill"></image>
					<text v-else class="avatar-letter">{{avatarLetter}}</text>
				</view>
				<text class="avatar-hint">点击更换头像</text>
			</view>

			<view class="form-item">
				<text class="label">昵称</text>
				<input class="input" v-model="nickname" placeholder="请输入昵称" />
			</view>
			<view style="height: 80px; flex-shrink: 0;"></view>
			<view class="save-btn" @click="saveProfile">
				<text class="save-text">保存</text>
			</view>
		</view>
	</scroll-view>
</template>

<script setup lang="ts">
	import CustomNavBar from '@/components/CustomNavBar.vue'
	import { ref, computed } from 'vue'
	import { onLoad } from '@dcloudio/uni-app'
	import { put } from '../../utils/request.uts'

	const nickname = ref('')
	const avatarUrl = ref('')

	const avatarLetter = computed(() : string => {
		if (nickname.value.length > 0) return nickname.value.substring(0, 1)
		return '?'
	})

	onLoad(() => {
		const info = uni.getStorageSync('userInfo') as string
		if (info.length > 0) {
			const obj = JSON.parse(info)
			if (obj != null) {
				nickname.value = (obj!['nickname'] as string) ?? ''
				avatarUrl.value = (obj!['avatar'] as string) ?? ''
			}
		}
	})

	function chooseAvatar() {
		uni.chooseImage({
			count: 1,
			sizeType: ['compressed'],
			success: (chooseRes) => {
				const tempPath = chooseRes.tempFilePaths[0]
				const token = uni.getStorageSync('token') as string
				uni.showLoading({ title: '上传中...' })
				uni.uploadFile({
					url: '/api/mobile/user/avatar',
					filePath: tempPath,
					name: 'file',
					header: { 'Authorization': `Bearer ${token}` },
					success: (uploadRes) => {
						uni.hideLoading()
						const data = JSON.parse(uploadRes.data as string)
						if (data != null && (data!['code'] as number) == 200) {
							const d = data!['data'] as any
							const url = (d['url'] as string) ?? ''
							avatarUrl.value = url
							updateStoredAvatar(url)
							uni.showToast({ title: '头像更新成功', icon: 'success' })
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

	function updateStoredAvatar(url : string) {
		const info = uni.getStorageSync('userInfo') as string
		if (info.length > 0) {
			const obj = JSON.parse(info)
			if (obj != null) {
				obj!['avatar'] = url
				uni.setStorageSync('userInfo', JSON.stringify(obj))
			}
		}
	}

	function saveProfile() {
		put('/api/mobile/user/profile', { nickname: nickname.value } as any).then((res) => {
			if (res.code == 200) {
				const info = uni.getStorageSync('userInfo') as string
				if (info.length > 0) {
					const obj = JSON.parse(info)
					if (obj != null) {
						obj!['nickname'] = nickname.value
						uni.setStorageSync('userInfo', JSON.stringify(obj))
					}
				}
				uni.showToast({ title: '保存成功', icon: 'success' })
			} else { uni.showToast({ title: res.msg, icon: 'none' }) }
		}).catch((_e) => {})
	}
</script>

<style>
	.profile-page {
		flex: 1;
		background-color: var(--color-bg-page);
	}

	.form-section {
		margin: var(--spacing-lg);
		padding: var(--spacing-2xl);
		background-color: var(--color-bg-card);
		border-radius: var(--radius-xl);
		box-shadow: var(--shadow-card);
	}

	.avatar-section {
		align-items: center;
		margin-bottom: var(--spacing-2xl);
		padding: var(--spacing-lg) 0;
	}

	.avatar-circle {
		width: 88px;
		height: 88px;
		border-radius: 44px;
		background: var(--gradient-primary);
		justify-content: center;
		align-items: center;
		overflow: hidden;
		margin-bottom: var(--spacing-sm);
		box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
	}

	.avatar-img {
		width: 88px;
		height: 88px;
		border-radius: 44px;
	}

	.avatar-letter {
		font-size: 36px;
		font-weight: 700;
		color: var(--color-text-inverse);
	}

	.avatar-hint {
		font-size: var(--font-sm);
		color: var(--color-primary);
		font-weight: 500;
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
		border-width: 1.5px;
		border-style: solid;
		border-color: var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--spacing-md) var(--spacing-lg);
		font-size: var(--font-md);
		background-color: var(--color-bg-input);
		color: var(--color-text-primary);
	}

	.save-btn {
		padding: var(--spacing-lg);
		background: var(--gradient-primary);
		border-radius: var(--radius-lg);
		align-items: center;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
		margin-top: var(--spacing-md);
		position: fixed;
		bottom: 16px;
		left: 16px;
		right: 16px;
		z-index: 99;
	}

	.save-btn:active {
		opacity: 0.85;
		transform: scale(0.98);
	}

	.save-text {
		font-size: var(--font-lg);
		color: var(--color-text-inverse);
		font-weight: 600;
		letter-spacing: 2px;
	}
</style>
