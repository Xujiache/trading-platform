<template>
  <view class="loading-container">
    <view class="loading-spinner" />
    <text v-if="text" class="loading-text">{{ text }}</text>
  </view>
</template>

<script setup lang="ts">
/**
 * 加载状态组件
 */
defineProps<{
  text?: string;
}>();
</script>

<style scoped>
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
}
.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e5e7eb;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.loading-text {
  margin-top: 12px;
  font-size: 14px;
  color: #666;
}
</style>
