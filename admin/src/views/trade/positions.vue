<template>
  <div class="positions-page">
    <a-page-header title="持仓列表" />
    <a-card>
      <a-table :data="tableData" :loading="loading">
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
          <a-table-column title="保证金" data-index="margin" :width="90" />
          <a-table-column title="浮盈" :width="80">
            <template #cell="{ record }">
              <span :style="{ color: parseFloat(record.floatingPnl || '0') >= 0 ? '#10b981' : '#ef4444' }">
                {{ record.floatingPnl || '0' }}
              </span>
            </template>
          </a-table-column>
          <a-table-column title="操作" :width="80">
            <template #cell="{ record }">
              <a-button type="text" status="danger" size="small" @click="handleForceClose(record)">强平</a-button>
            </template>
          </a-table-column>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
/**
 * 管理端持仓列表页面（含手动强平）
 */
import { ref, onMounted } from 'vue';
import { getPositionList, forceCloseOrder } from '../../api/trade';
import { Message, Modal } from '@arco-design/web-vue';

const loading = ref(false);
const tableData = ref<Record<string, unknown>[]>([]);

async function fetchData() {
  loading.value = true;
  try {
    tableData.value = (await getPositionList()) as unknown as Record<string, unknown>[];
  } catch { /* handled */ } finally {
    loading.value = false;
  }
}

function handleForceClose(record: Record<string, unknown>) {
  Modal.confirm({
    title: '确认强平',
    content: `确定要强制平仓订单 ${record.orderNo} 吗？`,
    onOk: async () => {
      try {
        await forceCloseOrder(record.id as number);
        Message.success('强平成功');
        fetchData();
      } catch { /* handled */ }
    },
  });
}

onMounted(() => fetchData());
</script>
