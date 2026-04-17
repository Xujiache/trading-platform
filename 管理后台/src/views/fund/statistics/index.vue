<template>
  <div class="statistics-page art-full-height">
    <ElRow :gutter="16" class="mb-4">
      <ElCol :span="4">
        <ElCard shadow="hover" class="stat-card">
          <div class="stat-title">累计入金</div>
          <div class="stat-value text-success">${{ formatNum(stats.totalDeposit) }}</div>
        </ElCard>
      </ElCol>
      <ElCol :span="4">
        <ElCard shadow="hover" class="stat-card">
          <div class="stat-title">累计出金</div>
          <div class="stat-value text-danger">${{ formatNum(stats.totalWithdraw) }}</div>
        </ElCard>
      </ElCol>
      <ElCol :span="4">
        <ElCard shadow="hover" class="stat-card">
          <div class="stat-title">出金手续费</div>
          <div class="stat-value">${{ formatNum(stats.totalWithdrawFee) }}</div>
        </ElCard>
      </ElCol>
      <ElCol :span="4">
        <ElCard shadow="hover" class="stat-card">
          <div class="stat-title">待处理出金</div>
          <div class="stat-value text-warning">
            {{ stats.pendingWithdrawCount }}笔 / ${{ formatNum(stats.pendingWithdrawAmount) }}
          </div>
        </ElCard>
      </ElCol>
      <ElCol :span="4">
        <ElCard shadow="hover" class="stat-card">
          <div class="stat-title">待处理入金</div>
          <div class="stat-value text-warning">{{ stats.pendingDepositCount }}笔</div>
        </ElCard>
      </ElCol>
      <ElCol :span="4">
        <ElCard shadow="hover" class="stat-card">
          <div class="stat-title">净入金</div>
          <div class="stat-value" :class="netDeposit >= 0 ? 'text-success' : 'text-danger'">
            ${{ formatNum(netDeposit) }}
          </div>
        </ElCard>
      </ElCol>
    </ElRow>

    <ElCard shadow="never">
      <div class="flex-between mb-4">
        <span class="font-bold">财务数据概览</span>
        <ElButton :icon="Refresh" @click="loadData">刷新</ElButton>
      </div>
      <ElDescriptions :column="2" border>
        <ElDescriptionsItem label="累计入金">${{ formatNum(stats.totalDeposit) }}</ElDescriptionsItem>
        <ElDescriptionsItem label="累计出金">${{ formatNum(stats.totalWithdraw) }}</ElDescriptionsItem>
        <ElDescriptionsItem label="出金手续费收入">${{ formatNum(stats.totalWithdrawFee) }}</ElDescriptionsItem>
        <ElDescriptionsItem label="净入金">${{ formatNum(netDeposit) }}</ElDescriptionsItem>
        <ElDescriptionsItem label="待处理出金">{{ stats.pendingWithdrawCount }}笔，共 ${{ formatNum(stats.pendingWithdrawAmount) }}</ElDescriptionsItem>
        <ElDescriptionsItem label="待处理入金">{{ stats.pendingDepositCount }}笔</ElDescriptionsItem>
      </ElDescriptions>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import { fetchFinancialStatistics } from '@/api/admin-fund'

const stats = reactive({
  totalDeposit: 0, totalWithdraw: 0, totalWithdrawFee: 0,
  pendingWithdrawCount: 0, pendingWithdrawAmount: 0, pendingDepositCount: 0
})

const netDeposit = computed(() => stats.totalDeposit - stats.totalWithdraw)

function formatNum(val: number) { return val.toFixed(2) }

async function loadData() {
  const res = await fetchFinancialStatistics()
  if (res) {
    Object.assign(stats, res)
  }
}

onMounted(() => loadData())
</script>

<style scoped>
.stat-card { text-align: center; }
.stat-title { font-size: 13px; color: #999; margin-bottom: 8px; }
.stat-value { font-size: 20px; font-weight: bold; }
.text-success { color: #52c41a; }
.text-danger { color: #ff4d4f; }
.text-warning { color: #fa8c16; }
.flex-between { display: flex; justify-content: space-between; align-items: center; }
</style>
