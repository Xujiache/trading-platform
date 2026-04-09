<template>
  <div class="dashboard-page">
    <a-page-header title="数据看板" subtitle="寰球汇金交易所运营概览" />
    <a-row :gutter="16" style="margin-bottom: 16px">
      <a-col :span="6"><a-card><a-statistic title="注册用户数" :value="data.totalUsers" /></a-card></a-col>
      <a-col :span="6"><a-card><a-statistic title="今日新增" :value="data.todayUsers" /></a-card></a-col>
      <a-col :span="6"><a-card><a-statistic title="累计入金" :value="data.totalDeposit" prefix="¥" /></a-card></a-col>
      <a-col :span="6"><a-card><a-statistic title="今日入金" :value="data.todayDeposit" prefix="¥" /></a-card></a-col>
    </a-row>
    <a-row :gutter="16">
      <a-col :span="6"><a-card><a-statistic title="累计出金" :value="data.totalWithdraw" prefix="¥" /></a-card></a-col>
      <a-col :span="6"><a-card><a-statistic title="今日交易" :value="data.todayTrades" suffix="笔" /></a-card></a-col>
      <a-col :span="6"><a-card><a-statistic title="总交易数" :value="data.totalTrades" suffix="笔" /></a-card></a-col>
      <a-col :span="6"><a-card><a-statistic title="累计盈亏" :value="data.totalPnl" prefix="¥" /></a-card></a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
/**
 * 数据看板页面 — 展示实时运营统计数据
 */
import { ref, onMounted } from 'vue';
import { getDashboard } from '../../api/report';

const data = ref({ totalUsers: 0, todayUsers: 0, totalDeposit: '0', todayDeposit: '0', totalWithdraw: '0', todayTrades: 0, totalTrades: 0, totalPnl: '0' });

onMounted(async () => {
  try { data.value = (await getDashboard()) as unknown as typeof data.value; } catch { /* handled */ }
});
</script>

