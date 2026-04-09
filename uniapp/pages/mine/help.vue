<template>
  <view class="help-page">
    <NavBar title="帮助中心" :show-back="true" />
    <view v-if="articles.length" class="article-list">
      <view v-for="item in articles" :key="item.id" class="article-card" @click="goDetail(item)">
        <text class="article-title">{{ item.title }}</text>
        <text class="article-category">{{ item.category }}</text>
      </view>
    </view>
    <Empty v-else text="暂无帮助文档" />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import NavBar from '../../components/NavBar.vue';
import Empty from '../../components/Empty.vue';
import { get } from '../../utils/request';

const articles = ref<Record<string, unknown>[]>([]);

function goDetail(item: Record<string, unknown>) { uni.navigateTo({ url: `/pages/mine/help-detail?id=${item.id}&title=${item.title}` }); }

onMounted(async () => { try { articles.value = await get('/api/mobile/help'); } catch {} });
</script>

<style scoped>
.help-page { min-height: 100vh; background: #f0f4f8; }
.article-list { padding: 12px 16px; }
.article-card { background: #fff; border-radius: 8px; padding: 14px 16px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; }
.article-title { font-size: 15px; color: #1a1a1a; }
.article-category { font-size: 12px; color: #999; }
</style>
