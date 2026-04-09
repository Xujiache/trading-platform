<template>
  <view class="navbar" :style="{ paddingTop: statusBarHeight + 'px' }">
    <view class="navbar-content" :style="{ height: navBarHeight + 'px' }">
      <view v-if="showBack" class="navbar-left" @click="handleBack">
        <text class="back-icon">‹</text>
      </view>
      <view class="navbar-title">
        <text class="title-text">{{ title }}</text>
      </view>
      <view class="navbar-right">
        <slot name="right" />
      </view>
    </view>
  </view>
  <view :style="{ height: (statusBarHeight + navBarHeight) + 'px' }" />
</template>

<script setup lang="ts">
/**
 * 自定义导航栏组件
 * 适配状态栏高度，支持返回按钮和右侧插槽
 */
import { ref } from 'vue';

defineProps<{
  title?: string;
  showBack?: boolean;
}>();

const statusBarHeight = ref(0);
const navBarHeight = ref(44);

const sysInfo = uni.getSystemInfoSync();
statusBarHeight.value = sysInfo.statusBarHeight || 0;

function handleBack() {
  uni.navigateBack({ delta: 1 });
}
</script>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 999;
  background-color: #ffffff;
}
.navbar-content {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 0 12px;
}
.navbar-left {
  position: absolute;
  left: 12px;
  display: flex;
  align-items: center;
  padding: 8px;
}
.back-icon {
  font-size: 28px;
  color: #333;
  font-weight: bold;
}
.navbar-title {
  flex: 1;
  text-align: center;
}
.title-text {
  font-size: 17px;
  font-weight: 600;
  color: #1a1a1a;
}
.navbar-right {
  position: absolute;
  right: 12px;
  display: flex;
  align-items: center;
}
</style>
