<template>
  <div>
    <a-page-header title="用户分析" />
    <a-row :gutter="16">
      <a-col :span="6"><a-card><a-statistic title="总用户数" :value="data.totalUsers" /></a-card></a-col>
      <a-col :span="6"><a-card><a-statistic title="7日活跃" :value="data.activeUsers7d" /></a-card></a-col>
    </a-row>
    <a-card style="margin-top: 16px" title="KYC 认证分布">
      <a-table :data="data.kycDistribution" :pagination="false">
        <template #columns>
          <a-table-column title="状态" data-index="status" />
          <a-table-column title="人数" data-index="count" />
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getUserAnalysis } from '../../api/report';

const data = ref({ totalUsers: 0, activeUsers7d: 0, kycDistribution: [] as { status: string; count: number }[], levelDistribution: [] });

onMounted(async () => {
  try { data.value = (await getUserAnalysis()) as unknown as typeof data.value; } catch { /* handled */ }
});
</script>
