<template>
  <div class="risk-report-page">
    <a-page-header title="风控报表" />
    <a-card>
      <a-spin :loading="loading">
        <a-row :gutter="16">
          <a-col :span="6">
            <a-statistic title="风险预警总数" :value="stats.totalAlerts" />
          </a-col>
          <a-col :span="6">
            <a-statistic title="强平次数" :value="stats.forceCloseCount" />
          </a-col>
          <a-col :span="6">
            <a-statistic title="高风险账户" :value="stats.highRiskUsers" />
          </a-col>
          <a-col :span="6">
            <a-statistic title="AML预警" :value="stats.amlAlerts" />
          </a-col>
        </a-row>
      </a-spin>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getRiskReport } from '../../api/report';

const loading = ref(false);
const stats = ref({ totalAlerts: 0, forceCloseCount: 0, highRiskUsers: 0, amlAlerts: 0 });

onMounted(async () => {
  loading.value = true;
  try {
    stats.value = await getRiskReport() as any;
  } finally {
    loading.value = false;
  }
});
</script>
