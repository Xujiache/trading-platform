<template>
  <view class="ticket-create-page">
    <NavBar title="提交工单" :show-back="true" />
    <view class="form-container">
      <view class="input-group">
        <text class="input-label">问题类型</text>
        <picker :range="types" @change="e => form.type = typeValues[e.detail.value]"><view class="input-field picker-field">{{ form.type ? types[typeValues.indexOf(form.type)] : '请选择' }}</view></picker>
      </view>
      <view class="input-group"><text class="input-label">标题</text><input v-model="form.title" class="input-field" placeholder="请输入标题" /></view>
      <view class="input-group"><text class="input-label">描述</text><textarea v-model="form.content" class="textarea-field" placeholder="请详细描述您的问题" /></view>
      <button class="submit-btn" @click="handleSubmit">提交</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import NavBar from '../../components/NavBar.vue';
import { post } from '../../utils/request';

const types = ['账户问题', '交易问题', '资金问题', '其他'];
const typeValues = ['account', 'trade', 'fund', 'other'];
const form = reactive({ type: '', title: '', content: '' });

async function handleSubmit() {
  if (!form.type || !form.title || !form.content) { uni.showToast({ title: '请填写完整信息', icon: 'none' }); return; }
  try { await post('/api/mobile/ticket', form); uni.showToast({ title: '工单已提交', icon: 'success' }); setTimeout(() => uni.navigateBack(), 1000); } catch {}
}
</script>

<style scoped>
.ticket-create-page { min-height: 100vh; background: #f0f4f8; }
.form-container { padding: 20px 24px; }
.input-group { margin-bottom: 20px; }
.input-label { font-size: 14px; color: #333; font-weight: 500; margin-bottom: 8px; display: block; }
.input-field { width: 100%; height: 48px; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 0 16px; font-size: 15px; box-sizing: border-box; }
.picker-field { display: flex; align-items: center; }
.textarea-field { width: 100%; height: 120px; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 16px; font-size: 15px; box-sizing: border-box; }
.submit-btn { width: 100%; height: 48px; background: #2563eb; color: #fff; font-size: 16px; font-weight: 600; border-radius: 8px; border: none; }
</style>
