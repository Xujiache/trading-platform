<template>
  <view class="login-page">
    <NavBar title="登录" />

    <view class="login-header">
      <text class="welcome-text">欢迎回来</text>
      <text class="sub-text">登录您的寰球汇金账户</text>
    </view>

    <view class="form-container">
      <view class="input-group">
        <text class="input-label">手机号 / 邮箱</text>
        <input
          v-model="form.account"
          class="input-field"
          placeholder="请输入手机号或邮箱"
          type="text"
        />
      </view>

      <view class="input-group">
        <text class="input-label">密码</text>
        <input
          v-model="form.password"
          class="input-field"
          placeholder="请输入密码"
          :password="!showPassword"
          type="text"
        />
      </view>

      <view class="forgot-row">
        <text class="forgot-link" @click="goForgotPassword">忘记密码？</text>
      </view>

      <button class="login-btn" :disabled="loading" @click="handleLogin">
        {{ loading ? '登录中...' : '登录' }}
      </button>

      <view class="register-row">
        <text class="register-text">还没有账号？</text>
        <text class="register-link" @click="goRegister">立即注册</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
/**
 * 登录页面
 * 支持手机号/邮箱 + 密码登录，集成 2FA 验证
 */
import { ref, reactive } from 'vue';
import NavBar from '../../components/NavBar.vue';
import { useUserStore } from '../../store/useUserStore';

const userStore = useUserStore();
const loading = ref(false);
const showPassword = ref(false);

const form = reactive({
  account: '',
  password: '',
});

async function handleLogin() {
  if (!form.account || !form.password) {
    uni.showToast({ title: '请输入账号和密码', icon: 'none' });
    return;
  }

  loading.value = true;
  try {
    const result = await userStore.login(form.account, form.password);
    if (result && 'requireTwoFactor' in result && result.requireTwoFactor) {
      uni.showToast({ title: '请输入两步验证码', icon: 'none' });
      return;
    }
    uni.switchTab({ url: '/pages/index/index' });
  } catch (err: unknown) {
    const error = err as Error;
    uni.showToast({ title: error.message || '登录失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
}

function goRegister() {
  uni.navigateTo({ url: '/pages/auth/register' });
}

function goForgotPassword() {
  uni.navigateTo({ url: '/pages/auth/forgot-password' });
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: #f0f4f8;
}
.login-header {
  padding: 40px 24px 20px;
}
.welcome-text {
  font-size: 28px;
  font-weight: bold;
  color: #1a1a1a;
  display: block;
}
.sub-text {
  font-size: 14px;
  color: #666;
  margin-top: 8px;
  display: block;
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
.forgot-row {
  text-align: right;
  margin-bottom: 24px;
}
.forgot-link {
  font-size: 14px;
  color: #2563eb;
}
.login-btn {
  width: 100%;
  height: 48px;
  background: #2563eb;
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
  border-radius: 8px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}
.login-btn[disabled] {
  opacity: 0.6;
}
.register-row {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
.register-text {
  font-size: 14px;
  color: #666;
}
.register-link {
  font-size: 14px;
  color: #2563eb;
  margin-left: 4px;
  font-weight: 500;
}
</style>
