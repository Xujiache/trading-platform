<template>
  <div class="operations-page art-full-height">
    <ElCard class="mb-4" shadow="never">
      <ElForm inline>
        <ElFormItem label="开始日期">
          <ElDatePicker v-model="dateRange.startDate" type="date" value-format="YYYY-MM-DD" placeholder="开始日期" style="width: 160px" />
        </ElFormItem>
        <ElFormItem label="结束日期">
          <ElDatePicker v-model="dateRange.endDate" type="date" value-format="YYYY-MM-DD" placeholder="结束日期" style="width: 160px" />
        </ElFormItem>
        <ElFormItem>
          <ElButton type="primary" @click="loadData">查询</ElButton>
          <ElButton @click="resetDate">重置</ElButton>
        </ElFormItem>
      </ElForm>
    </ElCard>

    <ElRow :gutter="16" class="mb-4">
      <ElCol :span="6">
        <ElCard shadow="hover" class="stat-card">
          <div class="stat-title">新增用户</div>
          <div class="stat-value">{{ data.newUsers }}</div>
        </ElCard>
      </ElCol>
      <ElCol :span="6">
        <ElCard shadow="hover" class="stat-card">
          <div class="stat-title">总入金</div>
          <div class="stat-value text-success">${{ formatNum(data.totalDeposit) }}</div>
        </ElCard>
      </ElCol>
      <ElCol :span="6">
        <ElCard shadow="hover" class="stat-card">
          <div class="stat-title">总出金</div>
          <div class="stat-value text-danger">${{ formatNum(data.totalWithdraw) }}</div>
        </ElCard>
      </ElCol>
      <ElCol :span="6">
        <ElCard shadow="hover" class="stat-card">
          <div class="stat-title">佣金收入</div>
          <div class="stat-value">${{ formatNum(data.totalCommission) }}</div>
        </ElCard>
      </ElCol>
    </ElRow>

    <ElCard shadow="never">
      <div class="flex-between mb-4">
        <span class="font-bold">入金趋势</span>
        <ElButton :icon="Refresh" circle @click="loadData" />
      </div>
      <ElTable :data="data.trend" border stripe v-if="data.trend.length > 0">
        <ElTableColumn prop="date" label="日期" width="150" />
        <ElTableColumn prop="deposit" label="入金金额">
          <template #default="{ row }">
            <span class="text-success font-bold">${{ parseFloat(row.deposit).toFixed(2) }}</span>
          </template>
        </ElTableColumn>
      </ElTable>
      <ElEmpty v-else description="暂无趋势数据" />
    </ElCard>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import { fetchOperationsOverview } from '@/api/admin-report'

const dateRange = reactive({ startDate: '', endDate: '' })
const data = reactive({
  newUsers: 0, totalDeposit: 0, totalWithdraw: 0, totalCommission: 0,
  trend: [] as any[]
})

function formatNum(val: number) { return val.toFixed(2) }

function resetDate() {
  dateRange.startDate = ''
  dateRange.endDate = ''
  loadData()
}

async function loadData() {
  const params: any = {}
  if (dateRange.startDate) params.startDate = dateRange.startDate
  if (dateRange.endDate) params.endDate = dateRange.endDate
  const res = await fetchOperationsOverview(params)
  if (res) {
    Object.assign(data, res)
  }
}

onMounted(() => loadData())
</script>

<style scoped>
.stat-card { text-align: center; }
.stat-title { font-size: 13px; color: #999; margin-bottom: 8px; }
.stat-value { font-size: 22px; font-weight: bold; }
.text-success { color: #52c41a; }
.text-danger { color: #ff4d4f; }
.flex-between { display: flex; justify-content: space-between; align-items: center; }
</style>
