<template>
  <view class="page">
    <NavBar title="修改密码" :show-back="true" />
    <view class="form-container">
      <view class="input-group"><text class="input-label">旧密码</text><input v-model="form.oldPassword" class="input-field" password placeholder="请输入旧密码" /></view>
      <view class="input-group"><text class="input-label">新密码</text><input v-model="form.newPassword" class="input-field" password placeholder="请输入新密码（至少8位）" /></view>
      <button class="submit-btn" @click="handleSubmit">确认修改</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import NavBar from '../../components/NavBar.vue';
import { put } from '../../utils/request';

const form = reactive({ oldPassword: '', newPassword: '' });

async function handleSubmit() {
  if (!form.oldPassword || !form.newPassword) { uni.showToast({ title: '请填写完整', icon: 'none' }); return; }
  try { await put('/api/mobile/user/password', form); uni.showToast({ title: '密码修改成功', icon: 'success' }); setTimeout(() => uni.navigateBack(), 1000); } catch {}
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
