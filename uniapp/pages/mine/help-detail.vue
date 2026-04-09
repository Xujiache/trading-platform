<template>
  <view class="help-detail-page">
    <NavBar :title="title" :show-back="true" />
    <view class="content"><text class="body-text">帮助文档详情内容</text></view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import NavBar from '../../components/NavBar.vue';

const title = ref('帮助详情');

onMounted(() => {
  const pages = getCurrentPages();
  const page = pages[pages.length - 1] as unknown as { options: Record<string, string> };
  title.value = page.options?.title || '帮助详情';
});
</script>

<style scoped>
.help-detail-page { min-height: 100vh; background: #f0f4f8; }
.content { padding: 20px 24px; background: #fff; margin: 16px; border-radius: 8px; }
.body-text { font-size: 14px; color: #333; line-height: 1.8; }
</style>
