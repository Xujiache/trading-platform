<template>
  <div>
    <a-page-header title="出金管理" />
    <a-card>
      <a-table :data="tableData" :loading="loading" :pagination="pagination" @page-change="handlePageChange">
        <template #columns>
          <a-table-column title="订单号" data-index="orderNo" :width="180" />
          <a-table-column title="用户" :width="100">
            <template #cell="{ record }">{{ record.user?.nickname || record.user?.phone }}</template>
          </a-table-column>
          <a-table-column title="金额" data-index="amount" :width="100" />
          <a-table-column title="银行卡" :width="150">
            <template #cell="{ record }">{{ record.bankCard?.bankName }} {{ record.bankCard?.cardNumber }}</template>
          </a-table-column>
          <a-table-column title="状态" :width="80">
            <template #cell="{ record }">
              <a-tag :color="statusColor(record.status)">{{ statusText(record.status) }}</a-tag>
            </template>
          </a-table-column>
          <a-table-column title="操作" :width="180">
            <template #cell="{ record }">
              <a-space>
                <a-button v-if="record.status === 'pending'" type="primary" size="small" @click="handleReview(record, 'approved')">通过</a-button>
                <a-button v-if="record.status === 'pending'" status="danger" size="small" @click="handleReview(record, 'rejected')">驳回</a-button>
                <a-button v-if="record.status === 'approved'" type="primary" size="small" @click="handleProcess(record)">确认打款</a-button>
              </a-space>
            </template>
          </a-table-column>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { getWithdraws, reviewWithdraw, processWithdraw } from '../../api/fund';
import { Message } from '@arco-design/web-vue';

const loading = ref(false);
const tableData = ref<Record<string, unknown>[]>([]);
const pagination = reactive({ current: 1, pageSize: 20, total: 0 });

function statusColor(s: string) {
  const map: Record<string, string> = { pending: 'orange', approved: 'blue', rejected: 'red', completed: 'green' };
  return map[s] || 'gray';
}

function statusText(s: string) {
  const map: Record<string, string> = { pending: '待审核', approved: '待打款', rejected: '已驳回', completed: '已完成' };
  return map[s] || s;
}

async function fetchData() {
  loading.value = true;
  try {
    const res = (await getWithdraws({ page: pagination.current, limit: pagination.pageSize })) as unknown as { list: Record<string, unknown>[]; pagination: { total: number } };
    tableData.value = res.list;
    pagination.total = res.pagination.total;
  } catch { /* handled */ } finally { loading.value = false; }
}

function handlePageChange(page: number) { pagination.current = page; fetchData(); }

async function handleReview(record: Record<string, unknown>, status: string) {
  try {
    await reviewWithdraw(record.id as number, { status });
    Message.success(status === 'approved' ? '审核通过' : '已驳回');
    fetchData();
  } catch { /* handled */ }
}

async function handleProcess(record: Record<string, unknown>) {
  try {
    await processWithdraw(record.id as number);
    Message.success('打款确认完成');
    fetchData();
  } catch { /* handled */ }
}

onMounted(() => fetchData());
</script>
