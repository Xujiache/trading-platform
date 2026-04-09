<template>
  <div class="splash-page">
    <a-page-header title="启动屏广告管理" />
    <a-card>
      <a-form :model="form" layout="vertical" style="max-width: 500px">
        <a-form-item label="是否启用"><a-switch v-model="form.enabled" /></a-form-item>
        <a-form-item label="广告图片链接"><a-input v-model="form.image" /></a-form-item>
        <a-form-item label="跳转链接"><a-input v-model="form.link" /></a-form-item>
        <a-form-item label="展示时长（秒）"><a-input-number v-model="form.duration" :min="1" :max="10" /></a-form-item>
        <a-button type="primary" @click="handleSave" :loading="saving">保存配置</a-button>
      </a-form>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { Message } from '@arco-design/web-vue';
import { getSystemConfig, updateSystemConfig } from '../../api/system';

const saving = ref(false);
const form = reactive({ enabled: false, image: '', link: '', duration: 3 });

onMounted(async () => {
  try {
    const data = await getSystemConfig({ category: 'splash' }) as any;
    if (Array.isArray(data)) {
      for (const item of data) {
        if (item.configKey === 'splash_enabled') form.enabled = item.configValue === 'true';
        if (item.configKey === 'splash_image') form.image = item.configValue;
        if (item.configKey === 'splash_link') form.link = item.configValue;
        if (item.configKey === 'splash_duration') form.duration = parseInt(item.configValue) || 3;
      }
    }
  } catch {}
});

async function handleSave() {
  saving.value = true;
  try {
    await updateSystemConfig([
      { configKey: 'splash_enabled', configValue: String(form.enabled), category: 'splash' },
      { configKey: 'splash_image', configValue: form.image, category: 'splash' },
      { configKey: 'splash_link', configValue: form.link, category: 'splash' },
      { configKey: 'splash_duration', configValue: String(form.duration), category: 'splash' },
    ]);
    Message.success('保存成功');
  } finally { saving.value = false; }
}
</script>
