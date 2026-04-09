<template>
  <view class="empty-container">
    <text class="empty-text">{{ text }}</text>
  </view>
</template>

<script setup lang="ts">
/**
 * 空状态组件
 * 用于数据为空时的提示展示
 */
defineProps<{
  text?: string;
}>();
</script>

<style scoped>
.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}
.empty-text {
  font-size: 14px;
  color: #999;
  margin-top: 12px;
}
</style>
