<template>
  <div class="user-analysis-page art-full-height">
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
          <div class="stat-title">盈利用户</div>
          <div class="stat-value text-success">{{ data.pnlDistribution.profitUsers }}</div>
        </ElCard>
      </ElCol>
      <ElCol :span="6">
        <ElCard shadow="hover" class="stat-card">
          <div class="stat-title">亏损用户</div>
          <div class="stat-value text-danger">{{ data.pnlDistribution.lossUsers }}</div>
        </ElCard>
      </ElCol>
      <ElCol :span="6">
        <ElCard shadow="hover" class="stat-card">
          <div class="stat-title">持平用户</div>
          <div class="stat-value">{{ data.pnlDistribution.evenUsers }}</div>
        </ElCard>
      </ElCol>
      <ElCol :span="6">
        <ElCard shadow="hover" class="stat-card">
          <div class="stat-title">活跃用户</div>
          <div class="stat-value">{{ data.weeklyActiveUsers }}</div>
        </ElCard>
      </ElCol>
    </ElRow>

    <ElCard shadow="never">
      <div class="flex-between mb-4">
        <span class="font-bold">Top交易用户(按盈利排名)</span>
        <ElButton :icon="Refresh" circle @click="loadData" />
      </div>
      <ElTable :data="data.topTraders" border stripe>
        <ElTableColumn type="index" label="#" width="50" />
        <ElTableColumn prop="id" label="用户ID" width="80" />
        <ElTableColumn prop="email" label="邮箱" width="200" show-overflow-tooltip />
        <ElTableColumn prop="nickname" label="昵称" width="120" />
        <ElTableColumn label="总盈亏" width="140">
          <template #default="{ row }">
            <span :class="row.totalProfit >= 0 ? 'text-success' : 'text-danger'" class="font-bold">
              ${{ row.totalProfit.toFixed(2) }}
            </span>
          </template>
        </ElTableColumn>
        <ElTableColumn label="余额" width="140">
          <template #default="{ row }">${{ row.balance.toFixed(2) }}</template>
        </ElTableColumn>
        <ElTableColumn label="累计入金" width="140">
          <template #default="{ row }">${{ row.totalDeposit.toFixed(2) }}</template>
        </ElTableColumn>
      </ElTable>
      <ElEmpty v-if="data.topTraders.length === 0" description="暂无数据" />
    </ElCard>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import { fetchUserAnalysis } from '@/api/admin-report'

const dateRange = reactive({ startDate: '', endDate: '' })
const data = reactive({
  pnlDistribution: { profitUsers: 0, lossUsers: 0, evenUsers: 0 },
  topTraders: [] as any[],
  weeklyActiveUsers: 0
})

function resetDate() {
  dateRange.startDate = ''
  dateRange.endDate = ''
  loadData()
}

async function loadData() {
  const params: any = {}
  if (dateRange.startDate) params.startDate = dateRange.startDate
  if (dateRange.endDate) params.endDate = dateRange.endDate
  const res = await fetchUserAnalysis(params)
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
