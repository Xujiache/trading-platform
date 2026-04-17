<template>
  <div class="art-full-height">
    <ElCard shadow="never" header="SMTP 邮箱配置">
      <ElForm :model="form" label-width="140px" v-loading="loading" style="max-width: 600px">
        <ElFormItem label="SMTP 服务器">
          <ElInput v-model="form.smtp_host" placeholder="如: smtp.qq.com" />
        </ElFormItem>
        <ElFormItem label="SMTP 端口">
          <ElInputNumber v-model.number="form.smtp_port" :min="1" :max="65535" />
        </ElFormItem>
        <ElFormItem label="是否 SSL">
          <ElSwitch v-model="form.smtp_secure_bool" />
        </ElFormItem>
        <ElFormItem label="SMTP 账号">
          <ElInput v-model="form.smtp_user" placeholder="发件邮箱地址" />
        </ElFormItem>
        <ElFormItem label="SMTP 密码/授权码">
          <ElInput v-model="form.smtp_pass" type="password" placeholder="授权码" show-password />
        </ElFormItem>
        <ElFormItem label="发件人地址">
          <ElInput v-model="form.smtp_from_address" placeholder="发件人邮箱" />
        </ElFormItem>
        <ElFormItem label="发件人名称">
          <ElInput v-model="form.smtp_from_name" placeholder="如: 交易系统" />
        </ElFormItem>
        <ElFormItem>
          <ElButton type="primary" @click="saveConfig" :loading="saving">保存配置</ElButton>
        </ElFormItem>
      </ElForm>
    </ElCard>

    <ElCard shadow="never" header="发送测试邮件" class="mt-4">
      <ElForm label-width="140px" style="max-width: 600px">
        <ElFormItem label="测试邮箱">
          <ElInput v-model="testEmail" placeholder="接收测试邮件的邮箱地址" />
        </ElFormItem>
        <ElFormItem>
          <ElButton type="success" @click="sendTest" :loading="testing">发送测试邮件</ElButton>
        </ElFormItem>
      </ElForm>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { fetchEmailConfig, updateEmailConfig, testEmail as testEmailApi } from '@/api/admin-config'
import { ElMessage } from 'element-plus'

defineOptions({ name: 'EmailConfig' })

const form = ref({
  smtp_host: '',
  smtp_port: 465,
  smtp_secure: 'true',
  smtp_secure_bool: true,
  smtp_user: '',
  smtp_pass: '',
  smtp_from_address: '',
  smtp_from_name: '交易系统',
})
const loading = ref(false)
const saving = ref(false)
const testing = ref(false)
const testEmail = ref('')

async function loadConfig() {
  loading.value = true
  try {
    const res = await fetchEmailConfig()
    if (res) {
      form.value.smtp_host = res.smtp_host || ''
      form.value.smtp_port = parseInt(res.smtp_port) || 465
      form.value.smtp_secure = res.smtp_secure || 'true'
      form.value.smtp_secure_bool = res.smtp_secure === 'true'
      form.value.smtp_user = res.smtp_user || ''
      form.value.smtp_pass = res.smtp_pass || ''
      form.value.smtp_from_address = res.smtp_from_address || ''
      form.value.smtp_from_name = res.smtp_from_name || '交易系统'
    }
  } catch {} finally {
    loading.value = false
  }
}

async function saveConfig() {
  saving.value = true
  try {
    await updateEmailConfig({
      smtp_host: form.value.smtp_host,
      smtp_port: String(form.value.smtp_port),
      smtp_secure: form.value.smtp_secure_bool ? 'true' : 'false',
      smtp_user: form.value.smtp_user,
      smtp_pass: form.value.smtp_pass,
      smtp_from_address: form.value.smtp_from_address,
      smtp_from_name: form.value.smtp_from_name,
    })
    ElMessage.success('邮箱配置保存成功')
  } catch {} finally {
    saving.value = false
  }
}

async function sendTest() {
  if (!testEmail.value) {
    ElMessage.warning('请输入测试邮箱地址')
    return
  }
  testing.value = true
  try {
    await testEmailApi(testEmail.value)
    ElMessage.success('测试邮件发送成功')
  } catch {} finally {
    testing.value = false
  }
}

onMounted(() => {
  loadConfig()
})
</script>
