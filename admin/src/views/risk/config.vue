<template>
  <div>
    <a-page-header title="风控参数配置" />
    <a-card>
      <a-table :data="configs" :loading="loading">
        <template #columns>
          <a-table-column title="参数键" data-index="configKey" :width="200" />
          <a-table-column title="参数值" data-index="configValue" :width="120" />
          <a-table-column title="描述" data-index="description" />
          <a-table-column title="分类" data-index="category" :width="100" />
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getRiskConfig } from '../../api/risk';

const loading = ref(false);
const configs = ref<Record<string, unknown>[]>([]);

onMounted(async () => {
  loading.value = true;
  try { configs.value = (await getRiskConfig()) as unknown as Record<string, unknown>[]; } catch { /* handled */ } finally { loading.value = false; }
});
</script>
