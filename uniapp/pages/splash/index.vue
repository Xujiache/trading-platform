<template>
  <view class="splash-page">
    <view class="splash-content">
      <view class="logo-circle">
        <text class="logo-text">汇金</text>
      </view>
      <text class="app-name">寰球汇金交易所</text>
      <text class="app-desc">全球贵金属 · 原油 CFD 交易平台</text>
    </view>
    <view class="splash-footer">
      <text class="version-text">v1.0.0</text>
    </view>
  </view>
</template>

<script setup lang="ts">
/**
 * 欢迎页 — 应用启动后的初始页面
 * 自动跳转到首页或登录页
 */
import { onMounted } from 'vue';

onMounted(() => {
  setTimeout(() => {
    const token = uni.getStorageSync('accessToken');
    if (token) {
      uni.switchTab({ url: '/pages/index/index' });
    } else {
      uni.reLaunch({ url: '/pages/auth/login' });
    }
  }, 1500);
});
</script>

<style scoped>
.splash-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #3b82f6 100%);
}
.splash-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.logo-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}
.logo-text {
  font-size: 28px;
  font-weight: bold;
  color: #ffffff;
}
.app-name {
  font-size: 24px;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 8px;
}
.app-desc {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
}
.splash-footer {
  position: absolute;
  bottom: 40px;
}
.version-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}
</style>
