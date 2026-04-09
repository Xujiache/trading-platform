<template>
  <div>
    <a-page-header title="强平记录" />
    <a-card>
      <a-table :data="tableData" :loading="loading">
        <template #columns>
          <a-table-column title="用户" :width="100">
            <template #cell="{ record }">{{ record.user?.nickname || record.user?.phone }}</template>
          </a-table-column>
          <a-table-column title="订单号" :width="180">
            <template #cell="{ record }">{{ record.tradeOrder?.orderNo }}</template>
          </a-table-column>
          <a-table-column title="强平价" data-index="closePrice" :width="100" />
          <a-table-column title="盈亏" :width="80">
            <template #cell="{ record }">
              <span :style="{ color: parseFloat(record.closedPnl) >= 0 ? '#10b981' : '#ef4444' }">{{ record.closedPnl }}</span>
            </template>
          </a-table-column>
          <a-table-column title="保证金比例" :width="100">
            <template #cell="{ record }">{{ record.marginRatio }}%</template>
          </a-table-column>
          <a-table-column title="原因" data-index="reason" :width="80" />
          <a-table-column title="时间" data-index="createdAt" :width="150" />
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getForceCloseRecords } from '../../api/risk';

const loading = ref(false);
const tableData = ref<Record<string, unknown>[]>([]);

onMounted(async () => {
  loading.value = true;
  try {
    const res = (await getForceCloseRecords({ page: 1, limit: 50 })) as unknown as { list: Record<string, unknown>[] };
    tableData.value = res.list;
  } catch { /* handled */ } finally { loading.value = false; }
});
</script>
