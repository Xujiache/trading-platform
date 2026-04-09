<template>
  <text class="price-flash" :class="flashClass">{{ price }}</text>
</template>

<script setup lang="ts">
/**
 * 价格闪烁组件
 * 价格变化时短暂闪烁绿色（上涨）或红色（下跌）
 */
import { ref, watch } from 'vue';

const props = defineProps<{
  price: string;
  prevPrice?: string;
}>();

const flashClass = ref('');

watch(() => props.price, (newVal, oldVal) => {
  if (!oldVal || newVal === oldVal) return;
  const cur = parseFloat(newVal);
  const prev = parseFloat(oldVal);
  flashClass.value = cur > prev ? 'flash-up' : cur < prev ? 'flash-down' : '';
  setTimeout(() => { flashClass.value = ''; }, 300);
});
</script>

<style scoped>
.price-flash { transition: color 0.15s; font-family: 'SF Mono', monospace; }
.flash-up { color: #10b981 !important; }
.flash-down { color: #ef4444 !important; }
</style>
