<template>
  <view class="mine-page">
    <view class="mine-header">
      <view class="user-info">
        <view class="avatar-circle">
          <text class="avatar-text">{{ avatarText }}</text>
        </view>
        <view class="user-detail">
          <text class="nickname">{{ userStore.userInfo?.nickname || '未登录' }}</text>
          <text class="kyc-badge" :class="kycClass">{{ kycText }}</text>
        </view>
      </view>
    </view>

    <view class="menu-list">
      <view class="menu-item" @click="navigate('/pages/mine/kyc')"><text class="menu-text">实名认证</text><text class="menu-arrow">›</text></view>
      <view class="menu-item" @click="navigate('/pages/mine/two-factor')"><text class="menu-text">两步验证</text><text class="menu-arrow">›</text></view>
      <view class="menu-item" @click="navigate('/pages/mine/risk-assessment')"><text class="menu-text">风险测评</text><text class="menu-arrow">›</text></view>
      <view class="menu-item" @click="navigate('/pages/mine/report')"><text class="menu-text">交易报表</text><text class="menu-arrow">›</text></view>
    </view>

    <view class="menu-list" style="margin-top: 12px;">
      <view class="menu-item" @click="navigate('/pages/mine/messages')"><text class="menu-text">消息中心</text><text class="menu-arrow">›</text></view>
      <view class="menu-item" @click="navigate('/pages/mine/ticket-list')"><text class="menu-text">我的工单</text><text class="menu-arrow">›</text></view>
      <view class="menu-item" @click="navigate('/pages/mine/help')"><text class="menu-text">帮助中心</text><text class="menu-arrow">›</text></view>
    </view>

    <view class="menu-list" style="margin-top: 12px;">
      <view class="menu-item" @click="navigate('/pages/mine/settings')"><text class="menu-text">账户设置</text><text class="menu-arrow">›</text></view>
      <view class="menu-item" @click="navigate('/pages/mine/about')"><text class="menu-text">关于我们</text><text class="menu-arrow">›</text></view>
    </view>

    <view class="logout-section">
      <button class="logout-btn" @click="handleLogout">退出登录</button>
    </view>
  </view>
</template>

<script setup lang="ts">
/**
 * 个人中心页（TabBar 页面）
 */
import { computed, onMounted } from 'vue';
import { useUserStore } from '../../store/useUserStore';

const userStore = useUserStore();

const avatarText = computed(() => {
  const name = userStore.userInfo?.nickname || '用';
  return name.charAt(0);
});

const kycText = computed(() => {
  const status = userStore.userInfo?.kycStatus;
  const map: Record<string, string> = { none: '未认证', pending: '审核中', approved: '已认证', rejected: '已驳回' };
  return map[status || 'none'] || '未认证';
});

const kycClass = computed(() => {
  const status = userStore.userInfo?.kycStatus;
  return `kyc-${status || 'none'}`;
});

function navigate(url: string) {
  uni.navigateTo({ url });
}

function handleLogout() {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) userStore.logout();
    },
  });
}

onMounted(() => {
  if (userStore.isLoggedIn) {
    userStore.fetchProfile().catch(() => {});
  }
});
</script>

<style scoped>
.mine-page { min-height: 100vh; background: #f0f4f8; }
.mine-header { padding: 60px 24px 30px; background: linear-gradient(135deg, #1e40af, #2563eb); }
.user-info { display: flex; align-items: center; gap: 16px; }
.avatar-circle { width: 56px; height: 56px; border-radius: 50%; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; }
.avatar-text { font-size: 24px; color: #fff; font-weight: bold; }
.user-detail { flex: 1; }
.nickname { font-size: 18px; font-weight: 600; color: #fff; display: block; }
.kyc-badge { font-size: 12px; padding: 2px 8px; border-radius: 4px; margin-top: 4px; display: inline-block; }
.kyc-none { background: rgba(255,255,255,0.2); color: rgba(255,255,255,0.8); }
.kyc-pending { background: #fbbf24; color: #92400e; }
.kyc-approved { background: #34d399; color: #065f46; }
.kyc-rejected { background: #f87171; color: #991b1b; }
.menu-list { margin: 16px; background: #fff; border-radius: 12px; overflow: hidden; }
.menu-item { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #f3f4f6; }
.menu-item:last-child { border-bottom: none; }
.menu-text { font-size: 15px; color: #1a1a1a; }
.menu-arrow { font-size: 20px; color: #ccc; }
.logout-section { padding: 20px 16px; }
.logout-btn { width: 100%; height: 48px; background: #fff; color: #ef4444; font-size: 16px; border-radius: 8px; border: 1px solid #fecaca; }
</style>
