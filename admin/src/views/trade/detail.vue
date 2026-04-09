<template>
  <div class="trade-detail-page">
    <a-page-header title="订单详情" @back="$router.back()" />
    <a-spin :loading="loading">
      <a-card title="订单信息">
        <a-descriptions :column="3">
          <a-descriptions-item label="订单号">{{ order.orderNo }}</a-descriptions-item>
          <a-descriptions-item label="品种">{{ order.symbol?.name }}</a-descriptions-item>
          <a-descriptions-item label="方向">
            <a-tag :color="order.direction === 'buy' ? 'green' : 'red'">
              {{ order.direction === 'buy' ? '买入' : '卖出' }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="手数">{{ order.lots }}</a-descriptions-item>
          <a-descriptions-item label="杠杆">1:{{ order.leverage }}</a-descriptions-item>
          <a-descriptions-item label="开仓价">{{ order.openPrice }}</a-descriptions-item>
          <a-descriptions-item label="平仓价">{{ order.closePrice || '-' }}</a-descriptions-item>
          <a-descriptions-item label="止损">{{ order.stopLoss || '-' }}</a-descriptions-item>
          <a-descriptions-item label="止盈">{{ order.takeProfit || '-' }}</a-descriptions-item>
          <a-descriptions-item label="保证金">{{ order.margin }}</a-descriptions-item>
          <a-descriptions-item label="手续费">{{ order.commission }}</a-descriptions-item>
          <a-descriptions-item label="隔夜费">{{ order.swap }}</a-descriptions-item>
          <a-descriptions-item label="浮动盈亏">{{ order.floatingPnl }}</a-descriptions-item>
          <a-descriptions-item label="平仓盈亏">{{ order.closedPnl || '-' }}</a-descriptions-item>
          <a-descriptions-item label="状态">
            <a-tag :color="order.status === 'open' ? 'blue' : order.status === 'closed' ? 'gray' : 'orange'">
              {{ { open: '持仓中', closed: '已平仓', cancelled: '已取消' }[order.status as string] }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="开仓时间">{{ order.openedAt }}</a-descriptions-item>
          <a-descriptions-item label="平仓时间">{{ order.closedAt || '-' }}</a-descriptions-item>
          <a-descriptions-item label="平仓原因">{{ order.closeReason || '-' }}</a-descriptions-item>
        </a-descriptions>
      </a-card>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { getOrderDetail } from '../../api/trade';

const route = useRoute();
const loading = ref(false);
const order = ref<any>({});

onMounted(async () => {
  loading.value = true;
  try {
    order.value = await getOrderDetail(Number(route.params.id)) as any;
  } finally {
    loading.value = false;
  }
});
</script>
