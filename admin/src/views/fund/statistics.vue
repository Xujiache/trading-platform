<template>
  <div>
    <a-page-header title="财务统计" />
    <a-row :gutter="16">
      <a-col :span="6"><a-card><a-statistic title="累计入金" :value="stats.totalDeposit" prefix="¥" /></a-card></a-col>
      <a-col :span="6"><a-card><a-statistic title="累计出金" :value="stats.totalWithdraw" prefix="¥" /></a-card></a-col>
      <a-col :span="6"><a-card><a-statistic title="待审入金" :value="stats.pendingDeposits" suffix="笔" /></a-card></a-col>
      <a-col :span="6"><a-card><a-statistic title="待审出金" :value="stats.pendingWithdraws" suffix="笔" /></a-card></a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getFinancialStats } from '../../api/fund';

const stats = ref({ totalDeposit: '0', totalWithdraw: '0', pendingDeposits: 0, pendingWithdraws: 0 });

onMounted(async () => {
  try { stats.value = (await getFinancialStats()) as unknown as typeof stats.value; } catch { /* handled */ }
});
</script>
