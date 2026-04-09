<template>
  <div class="config-page">
    <a-page-header title="系统配置" />
    <a-card>
      <a-spin :loading="loading">
        <a-form :model="configMap" layout="vertical">
          <a-row :gutter="16">
            <a-col :span="8" v-for="item in configList" :key="item.configKey">
              <a-form-item :label="item.description || item.configKey">
                <a-input v-model="configMap[item.configKey]" />
              </a-form-item>
            </a-col>
          </a-row>
        </a-form>
        <a-button type="primary" @click="handleSave" :loading="saving">保存配置</a-button>
      </a-spin>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { Message } from '@arco-design/web-vue';
import { getSystemConfig, updateSystemConfig } from '../../api/system';

const loading = ref(false);
const saving = ref(false);
const configList = ref<any[]>([]);
const configMap = reactive<Record<string, string>>({});

onMounted(async () => {
  loading.value = true;
  try {
    const data = await getSystemConfig() as any;
    configList.value = data || [];
    for (const item of configList.value) { configMap[item.configKey] = item.configValue; }
  } finally { loading.value = false; }
});

async function handleSave() {
  saving.value = true;
  try {
    await updateSystemConfig(configList.value.map((c: any) => ({ id: c.id, configKey: c.configKey, configValue: configMap[c.configKey] })));
    Message.success('保存成功');
  } finally { saving.value = false; }
}
</script>
