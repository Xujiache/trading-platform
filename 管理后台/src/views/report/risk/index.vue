<template>
  <div class="risk-page art-full-height">
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
      <ElCol :span="8">
        <ElCard shadow="hover" class="stat-card">
          <div class="stat-title">预警总量</div>
          <div class="stat-value text-warning">{{ data.warningCount }}</div>
        </ElCard>
      </ElCol>
      <ElCol :span="8">
        <ElCard shadow="hover" class="stat-card">
          <div class="stat-title">强平总量</div>
          <div class="stat-value text-danger">{{ data.forceCloseCount }}</div>
        </ElCard>
      </ElCol>
      <ElCol :span="8">
        <ElCard shadow="hover" class="stat-card">
          <div class="stat-title">风控状态</div>
          <div class="stat-value text-success">正常</div>
        </ElCard>
      </ElCol>
    </ElRow>

    <ElCard shadow="never">
      <div class="flex-between mb-4">
        <span class="font-bold">风险分布</span>
        <ElButton :icon="Refresh" circle @click="loadData" />
      </div>
      <ElTable :data="data.riskDistribution" border stripe>
        <ElTableColumn prop="level" label="风险等级" width="200" />
        <ElTableColumn prop="count" label="数量">
          <template #default="{ row }">
            <ElTag :type="row.level === '高风险' ? 'danger' : row.level === '中风险' ? 'warning' : 'success'" size="small">
              {{ row.count }}
            </ElTag>
          </template>
        </ElTableColumn>
      </ElTable>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import { fetchRiskReport } from '@/api/admin-report'

const dateRange = reactive({ startDate: '', endDate: '' })
const data = reactive({
  warningCount: 0, forceCloseCount: 0,
  riskDistribution: [] as any[]
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
  const res = await fetchRiskReport(params)
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
.text-warning { color: #fa8c16; }
.flex-between { display: flex; justify-content: space-between; align-items: center; }
</style>
