<template>
  <view class="page">
    <NavBar title="用户协议" :show-back="true" />
    <view class="content">
      <text class="title">寰球汇金交易所用户服务协议</text>
      <text class="body">欢迎使用寰球汇金交易所。请在注册和使用本平台前，仔细阅读以下条款。使用本平台即表示您已阅读、理解并同意受以下条款约束。</text>
      <text class="subtitle">一、服务内容</text>
      <text class="body">本平台提供黄金、白银、原油等贵金属及能源类 CFD 差价合约交易服务。所有交易均为模拟交易，不涉及真实资金。</text>
      <text class="subtitle">二、用户义务</text>
      <text class="body">用户应当提供真实、准确的个人信息，妥善保管账号密码，对账号下的一切活动负责。</text>
      <text class="subtitle">三、风险提示</text>
      <text class="body">CFD 交易存在较高风险，可能导致投资本金的全部损失。请根据自身风险承受能力审慎投资。</text>
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
