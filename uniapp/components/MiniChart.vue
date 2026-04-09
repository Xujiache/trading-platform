<template>
  <view class="mini-chart">
    <view class="chart-bar" v-for="(val, idx) in normalizedData" :key="idx" :style="{ height: val + '%' }" :class="isUp ? 'bar-up' : 'bar-down'" />
  </view>
</template>

<script setup lang="ts">
/**
 * 迷你面积图组件
 * 展示简化的价格趋势柱状图
 */
import { computed } from 'vue';

const props = defineProps<{
  data: number[];
  isUp?: boolean;
}>();

const normalizedData = computed(() => {
  if (!props.data.length) return [];
  const min = Math.min(...props.data);
  const max = Math.max(...props.data);
  const range = max - min || 1;
  return props.data.map((v) => 20 + ((v - min) / range) * 80);
});
</script>

<style scoped>
.mini-chart { display: flex; align-items: flex-end; gap: 1px; height: 30px; }
.chart-bar { width: 3px; border-radius: 1px; min-height: 2px; }
.bar-up { background: rgba(16, 185, 129, 0.6); }
.bar-down { background: rgba(239, 68, 68, 0.6); }
</style>
