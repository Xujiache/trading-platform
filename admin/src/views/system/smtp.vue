<template>
  <div class="smtp-page">
    <a-page-header title="SMTP 邮件配置" />
    <a-card>
      <a-spin :loading="loading">
        <a-form :model="form" layout="vertical" style="max-width: 600px">
          <a-form-item label="SMTP 服务器"><a-input v-model="form.host" /></a-form-item>
          <a-form-item label="端口"><a-input-number v-model="form.port" /></a-form-item>
          <a-form-item label="SSL"><a-switch v-model="form.secure" /></a-form-item>
          <a-form-item label="用户名"><a-input v-model="form.user" /></a-form-item>
          <a-form-item label="密码"><a-input-password v-model="form.password" /></a-form-item>
          <a-form-item label="发件人邮箱"><a-input v-model="form.from" /></a-form-item>
          <a-form-item label="发件人名称"><a-input v-model="form.fromName" /></a-form-item>
          <a-space>
            <a-button type="primary" @click="handleSave" :loading="saving">保存配置</a-button>
            <a-button @click="handleTest" :loading="testing">发送测试邮件</a-button>
          </a-space>
        </a-form>
      </a-spin>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { Message } from '@arco-design/web-vue';
import { getSmtpConfig, updateSmtpConfig, testSmtp } from '../../api/system';

const loading = ref(false);
const saving = ref(false);
const testing = ref(false);
const form = reactive({ host: '', port: 465, secure: true, user: '', password: '', from: '', fromName: '' });

onMounted(async () => {
  loading.value = true;
  try { const data = await getSmtpConfig() as any; if (data) Object.assign(form, data); } finally { loading.value = false; }
});

async function handleSave() { saving.value = true; try { await updateSmtpConfig(form); Message.success('保存成功'); } finally { saving.value = false; } }
async function handleTest() { testing.value = true; try { await testSmtp(); Message.success('测试邮件已发送'); } finally { testing.value = false; } }
</script>
