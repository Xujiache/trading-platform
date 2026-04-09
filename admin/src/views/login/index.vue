<template>
  <div class="login-container">
    <div class="login-card">
      <h2 class="login-title">寰球汇金交易所</h2>
      <p class="login-subtitle">管理后台</p>

      <a-form :model="form" layout="vertical" @submit="handleLogin">
        <a-form-item label="用户名" field="username" :rules="[{ required: true, message: '请输入用户名' }]">
          <a-input v-model="form.username" placeholder="请输入用户名" size="large" />
        </a-form-item>
        <a-form-item label="密码" field="password" :rules="[{ required: true, message: '请输入密码' }]">
          <a-input-password v-model="form.password" placeholder="请输入密码" size="large" />
        </a-form-item>
        <a-button type="primary" html-type="submit" :loading="loading" long size="large">
          登录
        </a-button>
      </a-form>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 管理员登录页面
 */
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../store/useAuthStore';
import { Message } from '@arco-design/web-vue';

const router = useRouter();
const authStore = useAuthStore();
const loading = ref(false);

const form = reactive({
  username: '',
  password: '',
});

async function handleLogin() {
  if (!form.username || !form.password) return;

  loading.value = true;
  try {
    await authStore.login(form.username, form.password);
    Message.success('登录成功');
    router.push('/dashboard');
  } catch {
    // Error handled by interceptor
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%);
}
.login-card {
  width: 400px;
  background: #fff;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}
.login-title {
  text-align: center;
  font-size: 24px;
  color: #1a1a1a;
  margin: 0 0 4px;
}
.login-subtitle {
  text-align: center;
  font-size: 14px;
  color: #666;
  margin: 0 0 32px;
}
</style>
