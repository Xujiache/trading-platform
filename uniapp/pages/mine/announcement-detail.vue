<template>
  <view class="announcement-detail-page">
    <NavBar title="资讯详情" />

    <view class="content-wrapper" v-if="article">
      <text class="title">{{ article.title }}</text>
      <text class="date">{{ formatDate(article.publishedAt || article.createdAt) }}</text>
      <view class="divider" />
      <rich-text :nodes="article.content" class="article-content" />
    </view>

    <view v-else class="loading-wrapper">
      <Loading />
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import NavBar from '../../components/NavBar.vue';
import Loading from '../../components/Loading.vue';
import { get } from '../../utils/request';
import { formatDate } from '../../utils/format';

const article = ref<any>(null);

onMounted(async () => {
  const pages = getCurrentPages();
  const page = pages[pages.length - 1] as any;
  const id = page.$page?.options?.id || (page as any).options?.id;

  if (id) {
    try {
      article.value = await get<any>(`/api/mobile/homepage/announcements/${id}`);
    } catch {}
  }
});
</script>

<style scoped>
.announcement-detail-page {
  min-height: 100vh;
  background: #fff;
}
.content-wrapper {
  padding: 32rpx;
}
.title {
  font-size: 36rpx;
  font-weight: 700;
  color: #1a1a2e;
  line-height: 1.4;
  display: block;
}
.date {
  font-size: 24rpx;
  color: #999;
  margin-top: 16rpx;
  display: block;
}
.divider {
  height: 1rpx;
  background: #f0f0f0;
  margin: 24rpx 0;
}
.article-content {
  font-size: 28rpx;
  color: #333;
  line-height: 1.8;
}
.loading-wrapper {
  display: flex;
  justify-content: center;
  padding-top: 200rpx;
}
</style>
