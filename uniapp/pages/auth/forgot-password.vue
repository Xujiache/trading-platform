<template>
  <view class="forgot-page">
    <NavBar title="忘记密码" :show-back="true" />

    <view class="form-container">
      <view class="input-group">
        <text class="input-label">手机号</text>
        <input v-model="form.phone" class="input-field" placeholder="请输入注册时的手机号" type="number" />
      </view>

      <view class="input-group">
        <text class="input-label">验证码</text>
        <view class="code-row">
          <input v-model="form.code" class="input-field code-input" placeholder="请输入验证码" type="number" />
          <button class="send-code-btn" :disabled="countdown > 0" @click="handleSendCode">
            {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
          </button>
        </view>
      </view>

      <view class="input-group">
        <text class="input-label">新密码</text>
        <input v-model="form.newPassword" class="input-field" placeholder="请设置新密码（至少8位）" password type="text" />
      </view>

      <button class="submit-btn" :disabled="loading" @click="handleReset">
        {{ loading ? '重置中...' : '重置密码' }}
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
/**
 * 忘记密码页面
 * 通过手机验证码重置密码
 */
import { ref, reactive } from 'vue';
import NavBar from '../../components/NavBar.vue';
import { post } from '../../utils/request';

const loading = ref(false);
const countdown = ref(0);
let timer: ReturnType<typeof setInterval> | null = null;

const form = reactive({
  phone: '',
  code: '',
  newPassword: '',
});

async function handleSendCode() {
  if (!/^1[3-9]\d{9}$/.test(form.phone)) {
    uni.showToast({ title: '请输入正确的手机号', icon: 'none' });
    return;
  }
  try {
    await post('/api/mobile/auth/send-code', { phone: form.phone, type: 'forgot_password' });
    uni.showToast({ title: '验证码已发送', icon: 'success' });
    countdown.value = 60;
    timer = setInterval(() => {
      countdown.value--;
      if (countdown.value <= 0 && timer) {
        clearInterval(timer);
        timer = null;
      }
    }, 1000);
  } catch (err: unknown) {
    const error = err as Error;
    uni.showToast({ title: error.message || '发送失败', icon: 'none' });
  }
}

async function handleReset() {
  if (!form.phone || !form.code || !form.newPassword) {
    uni.showToast({ title: '请填写完整信息', icon: 'none' });
    return;
  }
  loading.value = true;
  try {
    await post('/api/mobile/auth/forgot-password', form);
    uni.showToast({ title: '密码重置成功', icon: 'success' });
    setTimeout(() => uni.navigateBack(), 1500);
  } catch (err: unknown) {
    const error = err as Error;
    uni.showToast({ title: error.message || '重置失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.forgot-page { min-height: 100vh; background: #f0f4f8; }
.form-container { padding: 20px 24px; }
.input-group { margin-bottom: 20px; }
.input-label { font-size: 14px; color: #333; font-weight: 500; margin-bottom: 8px; display: block; }
.input-field { width: 100%; height: 48px; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 0 16px; font-size: 15px; box-sizing: border-box; }
.code-row { display: flex; gap: 12px; }
.code-input { flex: 1; }
.send-code-btn { width: 120px; height: 48px; background: #2563eb; color: #fff; font-size: 14px; border-radius: 8px; border: none; }
.send-code-btn[disabled] { opacity: 0.6; }
.submit-btn { width: 100%; height: 48px; background: #2563eb; color: #fff; font-size: 16px; font-weight: 600; border-radius: 8px; border: none; margin-top: 8px; }
.submit-btn[disabled] { opacity: 0.6; }
</style>
