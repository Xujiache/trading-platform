<template>
  <div>
    <a-page-header title="运营报表" />
    <a-card>
      <a-row :gutter="16">
        <a-col :span="4"><a-statistic title="新增用户" :value="data.newUsers" /></a-col>
        <a-col :span="4"><a-statistic title="入金笔数" :value="data.depositCount" /></a-col>
        <a-col :span="4"><a-statistic title="入金金额" :value="data.depositAmount" prefix="¥" /></a-col>
        <a-col :span="4"><a-statistic title="出金笔数" :value="data.withdrawCount" /></a-col>
        <a-col :span="4"><a-statistic title="出金金额" :value="data.withdrawAmount" prefix="¥" /></a-col>
        <a-col :span="4"><a-statistic title="交易笔数" :value="data.tradeCount" /></a-col>
      </a-row>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getOperationReport } from '../../api/report';

const data = ref({ newUsers: 0, depositCount: 0, depositAmount: '0', withdrawCount: 0, withdrawAmount: '0', tradeCount: 0 });

onMounted(async () => {
  try { data.value = (await getOperationReport()) as unknown as typeof data.value; } catch { /* handled */ }
});
</script>
