<template>
  <view class="page">
    <NavBar title="编辑资料" :show-back="true" />
    <view class="form-container">
      <view class="input-group"><text class="input-label">昵称</text><input v-model="form.nickname" class="input-field" placeholder="请输入昵称" /></view>
      <view class="input-group"><text class="input-label">邮箱</text><input v-model="form.email" class="input-field" placeholder="请输入邮箱" /></view>
      <button class="submit-btn" @click="handleSubmit">保存</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import NavBar from '../../components/NavBar.vue';
import { put } from '../../utils/request';

const form = reactive({ nickname: '', email: '' });

async function handleSubmit() {
  const data: Record<string, string> = {};
  if (form.nickname) data.nickname = form.nickname;
  if (form.email) data.email = form.email;
  try { await put('/api/mobile/user/profile', data); uni.showToast({ title: '保存成功', icon: 'success' }); setTimeout(() => uni.navigateBack(), 1000); } catch {}
}
</script>

<style scoped>
.page { min-height: 100vh; background: #f0f4f8; }
.form-container { padding: 20px 24px; }
.input-group { margin-bottom: 20px; }
.input-label { font-size: 14px; color: #333; font-weight: 500; margin-bottom: 8px; display: block; }
.input-field { width: 100%; height: 48px; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 0 16px; font-size: 15px; box-sizing: border-box; }
.submit-btn { width: 100%; height: 48px; background: #2563eb; color: #fff; font-size: 16px; font-weight: 600; border-radius: 8px; border: none; }
</style>
