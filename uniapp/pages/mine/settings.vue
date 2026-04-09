<template>
  <view class="settings-page">
    <NavBar title="账户设置" />

    <view class="settings-list">
      <view class="settings-item" @click="navigateTo('/pages/mine/change-password')">
        <text>修改密码</text>
        <text class="arrow">›</text>
      </view>
      <view class="settings-item" @click="navigateTo('/pages/mine/two-factor')">
        <text>两步验证</text>
        <view class="item-right">
          <text class="status-text">{{ userStore.userInfo?.twoFactorEnabled ? '已开启' : '未开启' }}</text>
          <text class="arrow">›</text>
        </view>
      </view>
      <view class="settings-item" @click="navigateTo('/pages/mine/profile-edit')">
        <text>编辑资料</text>
        <text class="arrow">›</text>
      </view>
      <view class="settings-item" @click="navigateTo('/pages/mine/agreement')">
        <text>用户协议</text>
        <text class="arrow">›</text>
      </view>
      <view class="settings-item" @click="navigateTo('/pages/mine/privacy')">
        <text>隐私政策</text>
        <text class="arrow">›</text>
      </view>
      <view class="settings-item" @click="navigateTo('/pages/mine/about')">
        <text>关于我们</text>
        <text class="arrow">›</text>
      </view>
    </view>

    <view class="logout-btn" @click="handleLogout">
      <text>退出登录</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import NavBar from '../../components/NavBar.vue';
import { useUserStore } from '../../store/useUserStore';

const userStore = useUserStore();

function navigateTo(url: string) {
  uni.navigateTo({ url });
}

function handleLogout() {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) userStore.logout();
    },
  });
}
</script>

<style scoped>
.settings-page {
  min-height: 100vh;
  background: #f0f4f8;
}
.settings-list {
  margin: 24rpx;
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
}
.settings-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
  font-size: 28rpx;
}
.item-right {
  display: flex;
  align-items: center;
  gap: 8rpx;
}
.status-text {
  font-size: 24rpx;
  color: #999;
}
.arrow {
  color: #ccc;
  font-size: 32rpx;
}
.logout-btn {
  margin: 48rpx 24rpx;
  background: #fff;
  border-radius: 16rpx;
  padding: 28rpx;
  text-align: center;
  color: #ef4444;
  font-size: 30rpx;
}
</style>
