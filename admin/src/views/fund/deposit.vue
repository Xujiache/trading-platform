<template>
  <div>
    <a-page-header title="入金管理" />
    <a-card>
      <a-table :data="tableData" :loading="loading" :pagination="pagination" @page-change="handlePageChange">
        <template #columns>
          <a-table-column title="订单号" data-index="orderNo" :width="180" />
          <a-table-column title="用户" :width="100">
            <template #cell="{ record }">{{ record.user?.nickname || record.user?.phone }}</template>
          </a-table-column>
          <a-table-column title="金额" data-index="amount" :width="100" />
          <a-table-column title="支付方式" data-index="paymentMethod" :width="100" />
          <a-table-column title="状态" :width="80">
            <template #cell="{ record }">
              <a-tag :color="record.status === 'pending' ? 'orange' : record.status === 'approved' ? 'green' : 'red'">
                {{ record.status === 'pending' ? '待审核' : record.status === 'approved' ? '已通过' : '已驳回' }}
              </a-tag>
            </template>
          </a-table-column>
          <a-table-column title="时间" data-index="createdAt" :width="150" />
          <a-table-column title="操作" :width="140">
            <template #cell="{ record }">
              <a-space v-if="record.status === 'pending'">
                <a-button type="primary" size="small" @click="handleReview(record, 'approved')">通过</a-button>
                <a-button status="danger" size="small" @click="handleReview(record, 'rejected')">驳回</a-button>
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
import { getDeposits, reviewDeposit } from '../../api/fund';
import { Message } from '@arco-design/web-vue';

const loading = ref(false);
const tableData = ref<Record<string, unknown>[]>([]);
const pagination = reactive({ current: 1, pageSize: 20, total: 0 });

async function fetchData() {
  loading.value = true;
  try {
    const res = (await getDeposits({ page: pagination.current, limit: pagination.pageSize })) as unknown as { list: Record<string, unknown>[]; pagination: { total: number } };
    tableData.value = res.list;
    pagination.total = res.pagination.total;
  } catch { /* handled */ } finally { loading.value = false; }
}

function handlePageChange(page: number) { pagination.current = page; fetchData(); }

async function handleReview(record: Record<string, unknown>, status: string) {
  try {
    await reviewDeposit(record.id as number, { status });
    Message.success(status === 'approved' ? '入金已通过' : '入金已驳回');
    fetchData();
  } catch { /* handled */ }
}

onMounted(() => fetchData());
</script>
