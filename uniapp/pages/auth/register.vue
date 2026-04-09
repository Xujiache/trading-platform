<template>
  <view class="register-page">
    <NavBar title="注册" :show-back="true" />

    <view class="form-container">
      <view class="input-group">
        <text class="input-label">手机号</text>
        <input v-model="form.phone" class="input-field" placeholder="请输入手机号" type="number" />
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
        <text class="input-label">密码</text>
        <input v-model="form.password" class="input-field" placeholder="请设置密码（至少8位）" password type="text" />
      </view>

      <view class="input-group">
        <text class="input-label">昵称（选填）</text>
        <input v-model="form.nickname" class="input-field" placeholder="请输入昵称" type="text" />
      </view>

      <button class="submit-btn" :disabled="loading" @click="handleRegister">
        {{ loading ? '注册中...' : '注册' }}
      </button>

      <view class="login-row">
        <text class="login-text">已有账号？</text>
        <text class="login-link" @click="goLogin">立即登录</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
/**
 * 注册页面
 * 手机号 + 验证码 + 密码注册流程
 */
import { ref, reactive } from 'vue';
import NavBar from '../../components/NavBar.vue';
import { useUserStore } from '../../store/useUserStore';
import { post } from '../../utils/request';

const userStore = useUserStore();
const loading = ref(false);
const countdown = ref(0);
let timer: ReturnType<typeof setInterval> | null = null;

const form = reactive({
  phone: '',
  code: '',
  password: '',
  nickname: '',
});

async function handleSendCode() {
  if (!/^1[3-9]\d{9}$/.test(form.phone)) {
    uni.showToast({ title: '请输入正确的手机号', icon: 'none' });
    return;
  }
  try {
    await post('/api/mobile/auth/send-code', { phone: form.phone, type: 'register' });
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

async function handleRegister() {
  if (!form.phone || !form.code || !form.password) {
    uni.showToast({ title: '请填写完整信息', icon: 'none' });
    return;
  }
  loading.value = true;
  try {
    await userStore.register(form.phone, form.password, form.code, form.nickname || undefined);
    uni.showToast({ title: '注册成功', icon: 'success' });
    setTimeout(() => uni.switchTab({ url: '/pages/index/index' }), 1000);
  } catch (err: unknown) {
    const error = err as Error;
    uni.showToast({ title: error.message || '注册失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
}

function goLogin() {
  uni.navigateBack();
}
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  background: #f0f4f8;
}
.form-container {
  padding: 20px 24px;
}
.input-group {
  margin-bottom: 20px;
}
.input-label {
  font-size: 14px;
  color: #333;
  font-weight: 500;
  margin-bottom: 8px;
  display: block;
}
.input-field {
  width: 100%;
  height: 48px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0 16px;
  font-size: 15px;
  box-sizing: border-box;
}
.code-row {
  display: flex;
  gap: 12px;
}
.code-input {
  flex: 1;
}
.send-code-btn {
  width: 120px;
  height: 48px;
  background: #2563eb;
  color: #ffffff;
  font-size: 14px;
  border-radius: 8px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}
.send-code-btn[disabled] {
  opacity: 0.6;
}
.submit-btn {
  width: 100%;
  height: 48px;
  background: #2563eb;
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
  border-radius: 8px;
  border: none;
  margin-top: 8px;
}
.submit-btn[disabled] {
  opacity: 0.6;
}
.login-row {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
.login-text {
  font-size: 14px;
  color: #666;
}
.login-link {
  font-size: 14px;
  color: #2563eb;
  margin-left: 4px;
  font-weight: 500;
}
</style>
