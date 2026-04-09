<template>
  <view class="page">
    <NavBar title="隐私政策" :show-back="true" />
    <view class="content">
      <text class="title">隐私政策</text>
      <text class="body">寰球汇金交易所（以下简称"本平台"）重视用户的隐私保护。本隐私政策说明我们如何收集、使用、存储和保护您的个人信息。</text>
      <text class="subtitle">一、信息收集</text>
      <text class="body">我们可能收集您的手机号、邮箱、实名信息（姓名和身份证号）用于账户注册和实名认证。</text>
      <text class="subtitle">二、信息使用</text>
      <text class="body">您的信息仅用于提供交易服务、身份验证、风险控制和客户支持。我们不会将您的个人信息出售给第三方。</text>
      <text class="subtitle">三、信息安全</text>
      <text class="body">我们采用行业标准的加密技术和安全措施保护您的个人信息，包括密码哈希、数据传输加密和访问控制。</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import NavBar from '../../components/NavBar.vue';
</script>

<style scoped>
.page { min-height: 100vh; background: #f0f4f8; }
.content { padding: 20px 24px; background: #fff; margin: 16px; border-radius: 12px; }
.title { font-size: 18px; font-weight: 600; color: #1a1a1a; display: block; margin-bottom: 16px; }
.subtitle { font-size: 15px; font-weight: 600; color: #1a1a1a; display: block; margin-top: 16px; margin-bottom: 8px; }
.body { font-size: 14px; color: #666; line-height: 1.8; display: block; }
</style>
