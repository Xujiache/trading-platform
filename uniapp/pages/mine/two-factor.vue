<template>
  <view class="two-factor-page">
    <NavBar title="两步验证" :show-back="true" />

    <view class="content">
      <view class="info-card">
        <text class="card-title">两步验证 (2FA)</text>
        <text class="card-desc">开启后登录时需要输入验证器生成的动态验证码，提升账户安全性</text>
      </view>

      <view v-if="!qrCode" class="action-section">
        <button class="action-btn" @click="handleGenerate">生成二维码</button>
      </view>

      <view v-else class="qr-section">
        <image :src="qrCode" class="qr-image" mode="aspectFit" />
        <text class="secret-text">密钥: {{ secret }}</text>

        <view class="input-group">
          <text class="input-label">验证码</text>
          <input v-model="code" class="input-field" placeholder="输入验证器上的6位数字" type="number" />
        </view>

        <button class="action-btn" @click="handleEnable">启用两步验证</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
/**
 * 两步验证设置页面
 * 生成 TOTP 二维码，用户扫码后输入验证码启用
 */
import { ref } from 'vue';
import NavBar from '../../components/NavBar.vue';
import { post } from '../../utils/request';

const qrCode = ref('');
const secret = ref('');
const code = ref('');

async function handleGenerate() {
  try {
    const data = await post<{ qrCode: string; secret: string }>('/api/mobile/two-factor/generate');
    qrCode.value = data.qrCode;
    secret.value = data.secret;
  } catch (err: unknown) {
    const error = err as Error;
    uni.showToast({ title: error.message || '生成失败', icon: 'none' });
  }
}

async function handleEnable() {
  if (!code.value || code.value.length !== 6) {
    uni.showToast({ title: '请输入6位验证码', icon: 'none' });
    return;
  }
  try {
    await post('/api/mobile/two-factor/enable', { code: code.value });
    uni.showToast({ title: '两步验证已开启', icon: 'success' });
    setTimeout(() => uni.navigateBack(), 1500);
  } catch (err: unknown) {
    const error = err as Error;
    uni.showToast({ title: error.message || '启用失败', icon: 'none' });
  }
}
</script>

<style scoped>
.two-factor-page { min-height: 100vh; background: #f0f4f8; }
.content { padding: 20px 24px; }
.info-card { background: #fff; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
.card-title { font-size: 16px; font-weight: 600; color: #1a1a1a; display: block; }
.card-desc { font-size: 14px; color: #666; margin-top: 8px; display: block; line-height: 1.5; }
.action-section { margin-top: 20px; }
.action-btn { width: 100%; height: 48px; background: #2563eb; color: #fff; font-size: 16px; font-weight: 600; border-radius: 8px; border: none; }
.qr-section { display: flex; flex-direction: column; align-items: center; }
.qr-image { width: 200px; height: 200px; margin: 20px 0; }
.secret-text { font-size: 12px; color: #666; margin-bottom: 20px; word-break: break-all; }
.input-group { width: 100%; margin-bottom: 20px; }
.input-label { font-size: 14px; color: #333; font-weight: 500; margin-bottom: 8px; display: block; }
.input-field { width: 100%; height: 48px; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 0 16px; font-size: 15px; box-sizing: border-box; text-align: center; }
</style>
