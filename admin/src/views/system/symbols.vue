<template>
  <div class="symbols-page">
    <a-page-header title="品种管理" />

    <a-card>
      <a-table :data="tableData" :loading="loading">
        <template #columns>
          <a-table-column title="代码" data-index="symbol" :width="100" />
          <a-table-column title="名称" data-index="name" :width="100" />
          <a-table-column title="分类" :width="100">
            <template #cell="{ record }">
              {{ record.category === 'precious_metal' ? '贵金属' : '能源' }}
            </template>
          </a-table-column>
          <a-table-column title="合约单位" data-index="contractUnit" :width="80" />
          <a-table-column title="点差" data-index="spreadValue" :width="80" />
          <a-table-column title="手续费" data-index="commissionValue" :width="80" />
          <a-table-column title="杠杆" :width="100">
            <template #cell="{ record }">
              1:{{ record.leverageMin }} ~ 1:{{ record.leverageMax }}
            </template>
          </a-table-column>
          <a-table-column title="状态" :width="80">
            <template #cell="{ record }">
              <a-switch :model-value="record.status === 1" @change="(v: boolean) => toggleStatus(record, v)" />
            </template>
          </a-table-column>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
/**
 * 品种管理页面
 * 展示品种列表，支持启用/禁用切换
 */
import { ref, onMounted } from 'vue';
import { getSymbolList, updateSymbolStatus } from '../../api/symbol';
import { Message } from '@arco-design/web-vue';

const loading = ref(false);
const tableData = ref<Record<string, unknown>[]>([]);

async function fetchData() {
  loading.value = true;
  try {
    tableData.value = (await getSymbolList()) as unknown as Record<string, unknown>[];
  } catch { /* handled */ } finally {
    loading.value = false;
  }
}

async function toggleStatus(record: Record<string, unknown>, enabled: boolean) {
  try {
    await updateSymbolStatus(record.id as number, enabled ? 1 : 0);
    Message.success(enabled ? '已启用' : '已禁用');
    fetchData();
  } catch { /* handled */ }
}

onMounted(() => fetchData());
</script>
