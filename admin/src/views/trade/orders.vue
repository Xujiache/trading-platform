<template>
  <div class="orders-page">
    <a-page-header title="订单列表" />
    <a-card>
      <div class="search-bar">
        <a-input v-model="searchForm.keyword" placeholder="搜索订单号" style="width: 200px" allow-clear />
        <a-select v-model="searchForm.status" placeholder="订单状态" style="width: 120px" allow-clear>
          <a-option value="open">持仓中</a-option>
          <a-option value="closed">已平仓</a-option>
          <a-option value="cancelled">已取消</a-option>
        </a-select>
        <a-button type="primary" @click="fetchData">搜索</a-button>
      </div>

      <a-table :data="tableData" :loading="loading" :pagination="pagination" @page-change="handlePageChange">
        <template #columns>
          <a-table-column title="订单号" data-index="orderNo" :width="180" />
          <a-table-column title="用户ID" data-index="userId" :width="70" />
          <a-table-column title="品种" :width="80">
            <template #cell="{ record }">{{ record.symbol?.name || '-' }}</template>
          </a-table-column>
          <a-table-column title="方向" :width="60">
            <template #cell="{ record }">
              <a-tag :color="record.direction === 'buy' ? 'green' : 'red'">{{ record.direction === 'buy' ? '多' : '空' }}</a-tag>
            </template>
          </a-table-column>
          <a-table-column title="手数" data-index="lots" :width="60" />
          <a-table-column title="开仓价" data-index="openPrice" :width="90" />
          <a-table-column title="平仓价" data-index="closePrice" :width="90" />
          <a-table-column title="盈亏" :width="80">
            <template #cell="{ record }">
              <span :style="{ color: parseFloat(record.closedPnl || '0') >= 0 ? '#10b981' : '#ef4444' }">
                {{ record.closedPnl || record.floatingPnl || '0' }}
              </span>
            </template>
          </a-table-column>
          <a-table-column title="状态" :width="80">
            <template #cell="{ record }">
              <a-tag :color="record.status === 'open' ? 'green' : 'gray'">
                {{ record.status === 'open' ? '持仓' : record.status === 'closed' ? '已平仓' : '取消' }}
              </a-tag>
            </template>
          </a-table-column>
          <a-table-column title="开仓时间" data-index="openedAt" :width="150" />
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
/**
 * 管理端订单列表页面
 */
import { ref, reactive, onMounted } from 'vue';
import { getOrderList } from '../../api/trade';

const loading = ref(false);
const tableData = ref<Record<string, unknown>[]>([]);
const searchForm = reactive({ keyword: '', status: '' });
const pagination = reactive({ current: 1, pageSize: 20, total: 0 });

async function fetchData() {
  loading.value = true;
  try {
    const res = (await getOrderList({
      page: pagination.current,
      limit: pagination.pageSize,
      ...searchForm,
    })) as unknown as { list: Record<string, unknown>[]; pagination: { total: number } };
    tableData.value = res.list;
    pagination.total = res.pagination.total;
  } catch { /* handled */ } finally {
    loading.value = false;
  }
}

function handlePageChange(page: number) { pagination.current = page; fetchData(); }

onMounted(() => fetchData());
</script>

<style scoped>
.search-bar { display: flex; gap: 12px; margin-bottom: 16px; }
</style>
