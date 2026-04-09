<template>
  <view class="tab-bar">
    <view
      v-for="item in tabs"
      :key="item.path"
      class="tab-item"
      :class="{ active: currentPath === item.path }"
      @click="switchTab(item.path)"
    >
      <view class="tab-icon">{{ item.icon }}</view>
      <text class="tab-text">{{ item.text }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
/**
 * 自定义 TabBar 组件
 * 底部 5 个 Tab 导航
 */
import { ref, onMounted } from 'vue';

const tabs = [
  { path: '/pages/index/index', text: '首页', icon: '🏠' },
  { path: '/pages/market/index', text: '行情', icon: '📊' },
  { path: '/pages/trade/index', text: '交易', icon: '💹' },
  { path: '/pages/assets/index', text: '资产', icon: '💰' },
  { path: '/pages/mine/index', text: '我的', icon: '👤' },
];

const currentPath = ref('');

onMounted(() => {
  const pages = getCurrentPages();
  if (pages.length) {
    currentPath.value = '/' + pages[pages.length - 1].route;
  }
});

function switchTab(path: string) {
  if (currentPath.value === path) return;
  uni.switchTab({ url: path });
}
</script>

<style scoped>
.tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100rpx;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-around;
  border-top: 1rpx solid #e5e7eb;
  padding-bottom: env(safe-area-inset-bottom);
  z-index: 999;
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  height: 100%;
}

.tab-icon {
  font-size: 40rpx;
  line-height: 1;
}

.tab-text {
  font-size: 20rpx;
  color: #999;
  margin-top: 4rpx;
}

.tab-item.active .tab-text {
  color: #2563eb;
  font-weight: 600;
}
</style>
