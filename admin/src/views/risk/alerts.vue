<template>
  <div>
    <a-page-header title="风险预警" />
    <a-card>
      <a-table :data="tableData" :loading="loading" :pagination="pagination" @page-change="handlePageChange">
        <template #columns>
          <a-table-column title="用户" :width="100">
            <template #cell="{ record }">{{ record.user?.nickname || record.user?.phone }}</template>
          </a-table-column>
          <a-table-column title="类型" :width="100">
            <template #cell="{ record }">{{ typeText(record.alertType) }}</template>
          </a-table-column>
          <a-table-column title="级别" :width="80">
            <template #cell="{ record }">
              <a-tag :color="levelColor(record.alertLevel)">{{ record.alertLevel }}</a-tag>
            </template>
          </a-table-column>
          <a-table-column title="描述" data-index="description" />
          <a-table-column title="状态" :width="80">
            <template #cell="{ record }">
              <a-tag :color="record.status === 'pending' ? 'orange' : 'green'">{{ record.status === 'pending' ? '待处理' : '已处理' }}</a-tag>
            </template>
          </a-table-column>
          <a-table-column title="操作" :width="100">
            <template #cell="{ record }">
              <a-button v-if="record.status === 'pending'" type="primary" size="small" @click="handleProcess(record)">处理</a-button>
            </template>
          </a-table-column>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { getRiskAlerts, processAlert } from '../../api/risk';
import { Message } from '@arco-design/web-vue';

const loading = ref(false);
const tableData = ref<Record<string, unknown>[]>([]);
const pagination = reactive({ current: 1, pageSize: 20, total: 0 });

function typeText(t: string) {
  const map: Record<string, string> = { margin_warning: '保证金预警', large_trade: '大额交易', aml_suspicious: '反洗钱可疑' };
  return map[t] || t;
}
function levelColor(l: string) {
  const map: Record<string, string> = { low: 'blue', medium: 'orange', high: 'red', critical: 'red' };
  return map[l] || 'gray';
}

async function fetchData() {
  loading.value = true;
  try {
    const res = (await getRiskAlerts({ page: pagination.current, limit: pagination.pageSize })) as unknown as { list: Record<string, unknown>[]; pagination: { total: number } };
    tableData.value = res.list;
    pagination.total = res.pagination.total;
  } catch { /* handled */ } finally { loading.value = false; }
}

function handlePageChange(page: number) { pagination.current = page; fetchData(); }

async function handleProcess(record: Record<string, unknown>) {
  try {
    await processAlert(record.id as number, { status: 'processed', processRemark: '已处理' });
    Message.success('预警已处理');
    fetchData();
  } catch { /* handled */ }
}

onMounted(() => fetchData());
</script>
