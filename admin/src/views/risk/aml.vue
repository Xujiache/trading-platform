<template>
  <div class="aml-page">
    <a-page-header title="反洗钱监控" />
    <a-card>
      <a-table :data="tableData" :pagination="pagination" :loading="loading" @page-change="handlePageChange">
        <template #columns>
          <a-table-column title="ID" data-index="id" :width="60" />
          <a-table-column title="用户ID" data-index="userId" :width="80" />
          <a-table-column title="预警类型" :width="120">
            <template #cell="{ record }">
              <a-tag color="red">{{ record.alertType }}</a-tag>
            </template>
          </a-table-column>
          <a-table-column title="预警级别" :width="100">
            <template #cell="{ record }">
              <a-tag :color="levelColor(record.alertLevel)">{{ record.alertLevel }}</a-tag>
            </template>
          </a-table-column>
          <a-table-column title="描述" data-index="description" />
          <a-table-column title="状态" :width="100">
            <template #cell="{ record }">
              <a-tag :color="record.status === 'pending' ? 'orange' : 'green'">
                {{ record.status === 'pending' ? '待处理' : '已处理' }}
              </a-tag>
            </template>
          </a-table-column>
          <a-table-column title="时间" data-index="createdAt" :width="180" />
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { getAmlAlerts } from '../../api/risk';

function levelColor(level: string) {
  return { low: 'blue', medium: 'orange', high: 'red', critical: 'magenta' }[level] || 'gray';
}

const tableData = ref([]);
const loading = ref(false);
const pagination = reactive({ current: 1, pageSize: 20, total: 0 });

async function fetchData() {
  loading.value = true;
  try {
    const res = await getAmlAlerts({ page: pagination.current, limit: pagination.pageSize }) as any;
    tableData.value = res.list || [];
    pagination.total = res.pagination?.total || 0;
  } finally {
    loading.value = false;
  }
}

function handlePageChange(page: number) {
  pagination.current = page;
  fetchData();
}

onMounted(fetchData);
</script>
