<template>
  <div class="fund-flows-page">
    <a-page-header title="资金流水" />
    <a-card>
      <div class="search-bar" style="display: flex; gap: 12px; margin-bottom: 16px">
        <a-input v-model="searchForm.userId" placeholder="用户ID" style="width: 120px" allow-clear />
        <a-select v-model="searchForm.flowType" placeholder="流水类型" style="width: 140px" allow-clear>
          <a-option value="deposit">入金</a-option>
          <a-option value="withdraw">出金</a-option>
          <a-option value="commission">手续费</a-option>
          <a-option value="swap">隔夜费</a-option>
          <a-option value="pnl">平仓盈亏</a-option>
          <a-option value="frozen">冻结</a-option>
          <a-option value="unfrozen">解冻</a-option>
        </a-select>
        <a-button type="primary" @click="fetchData">搜索</a-button>
      </div>
      <a-table :data="tableData" :pagination="pagination" :loading="loading" @page-change="handlePageChange">
        <template #columns>
          <a-table-column title="ID" data-index="id" :width="60" />
          <a-table-column title="用户ID" data-index="userId" :width="80" />
          <a-table-column title="类型" data-index="flowType" :width="100" />
          <a-table-column title="金额" data-index="amount" :width="120" />
          <a-table-column title="变动前余额" data-index="balanceBefore" :width="120" />
          <a-table-column title="变动后余额" data-index="balanceAfter" :width="120" />
          <a-table-column title="备注" data-index="remark" />
          <a-table-column title="时间" data-index="createdAt" :width="180" />
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { getFundFlows } from '../../api/fund';

const searchForm = reactive({ userId: '', flowType: '' });
const tableData = ref([]);
const loading = ref(false);
const pagination = reactive({ current: 1, pageSize: 20, total: 0 });

async function fetchData() {
  loading.value = true;
  try {
    const res = await getFundFlows({ ...searchForm, page: pagination.current, limit: pagination.pageSize }) as any;
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
