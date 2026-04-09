<template>
  <view class="about-page">
    <NavBar title="关于我们" :show-back="true" />
    <view class="about-content">
      <view class="logo-section">
        <view class="logo-circle"><text class="logo-text">汇金</text></view>
        <text class="app-name">寰球汇金交易所</text>
        <text class="version">v1.0.0</text>
      </view>
      <view class="info-card">
        <text class="info-text">寰球汇金交易所是一款专业的黄金、白银、原油 CFD 差价合约在线交易平台，致力于为全球投资者提供安全、便捷、透明的交易服务。</text>
      </view>
      <view class="link-list">
        <view class="link-item" @click="navigate('/pages/mine/agreement')"><text class="link-text">用户协议</text><text class="link-arrow">›</text></view>
        <view class="link-item" @click="navigate('/pages/mine/privacy')"><text class="link-text">隐私政策</text><text class="link-arrow">›</text></view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import NavBar from '../../components/NavBar.vue';
function navigate(url: string) { uni.navigateTo({ url }); }
</script>

<style scoped>
.about-page { min-height: 100vh; background: #f0f4f8; }
.about-content { padding: 40px 24px; }
.logo-section { display: flex; flex-direction: column; align-items: center; margin-bottom: 32px; }
.logo-circle { width: 72px; height: 72px; border-radius: 50%; background: #2563eb; display: flex; align-items: center; justify-content: center; }
.logo-text { font-size: 24px; font-weight: bold; color: #fff; }
.app-name { font-size: 20px; font-weight: 600; color: #1a1a1a; margin-top: 12px; }
.version { font-size: 13px; color: #999; margin-top: 4px; }
.info-card { background: #fff; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
.info-text { font-size: 14px; color: #666; line-height: 1.8; }
.link-list { background: #fff; border-radius: 12px; overflow: hidden; }
.link-item { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #f3f4f6; }
.link-item:last-child { border-bottom: none; }
.link-text { font-size: 15px; color: #1a1a1a; }
.link-arrow { font-size: 20px; color: #ccc; }
</style>
