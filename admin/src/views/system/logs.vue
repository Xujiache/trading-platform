<template>
  <div class="logs-page">
    <a-page-header title="操作日志" />
    <a-card>
      <div class="search-bar" style="display: flex; gap: 12px; margin-bottom: 16px">
        <a-select v-model="searchForm.module" placeholder="操作模块" style="width: 140px" allow-clear>
          <a-option v-for="m in modules" :key="m" :value="m">{{ m }}</a-option>
        </a-select>
        <a-range-picker v-model="dateRange" style="width: 260px" />
        <a-button type="primary" @click="fetchData">搜索</a-button>
      </div>
      <a-table :data="tableData" :pagination="pagination" :loading="loading" @page-change="handlePageChange">
        <template #columns>
          <a-table-column title="ID" data-index="id" :width="60" />
          <a-table-column title="管理员" :width="120">
            <template #cell="{ record }">{{ record.admin?.realName || '-' }}</template>
          </a-table-column>
          <a-table-column title="模块" data-index="module" :width="120" />
          <a-table-column title="操作" data-index="action" :width="120" />
          <a-table-column title="操作对象" :width="140">
            <template #cell="{ record }">{{ record.targetType ? `${record.targetType}#${record.targetId}` : '-' }}</template>
          </a-table-column>
          <a-table-column title="IP" data-index="ip" :width="130" />
          <a-table-column title="时间" data-index="createdAt" :width="180" />
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import request from '../../utils/request';

const searchForm = reactive({ module: '' });
const dateRange = ref<string[]>([]);
const modules = ref<string[]>([]);
const tableData = ref([]);
const loading = ref(false);
const pagination = reactive({ current: 1, pageSize: 20, total: 0 });

async function fetchData() {
  loading.value = true;
  try {
    const params: Record<string, any> = { page: pagination.current, limit: pagination.pageSize, ...searchForm };
    if (dateRange.value?.length === 2) { params.startDate = dateRange.value[0]; params.endDate = dateRange.value[1]; }
    const res = await request.get('/log', { params }) as any;
    tableData.value = res.list || []; pagination.total = res.pagination?.total || 0;
  } finally { loading.value = false; }
}

function handlePageChange(p: number) { pagination.current = p; fetchData(); }

onMounted(async () => {
  modules.value = (await request.get('/log/modules')) as any || [];
  fetchData();
});
</script>
