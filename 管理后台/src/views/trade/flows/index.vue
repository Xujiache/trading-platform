<template>
  <div class="flows-page art-full-height">
    <ElCard class="mb-4" shadow="never">
      <ElForm :model="searchForm" inline>
        <ElFormItem label="用户ID">
          <ElInput v-model="searchForm.userId" placeholder="用户ID" clearable style="width: 120px" />
        </ElFormItem>
        <ElFormItem label="类型">
          <ElSelect v-model="searchForm.flowType" placeholder="全部" clearable style="width: 120px">
            <ElOption label="开仓" value="open" />
            <ElOption label="平仓" value="close" />
            <ElOption label="手续费" value="commission" />
            <ElOption label="隔夜费" value="swap" />
            <ElOption label="入金" value="deposit" />
            <ElOption label="出金" value="withdraw" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="账户">
          <ElSelect v-model="searchForm.accountType" placeholder="全部" clearable style="width: 100px">
            <ElOption label="实盘" value="real" />
            <ElOption label="模拟" value="demo" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="开始日期">
          <ElDatePicker v-model="searchForm.startDate" type="date" value-format="YYYY-MM-DD" placeholder="选择日期"
            style="width: 160px" />
        </ElFormItem>
        <ElFormItem label="结束日期">
          <ElDatePicker v-model="searchForm.endDate" type="date" value-format="YYYY-MM-DD" placeholder="选择日期"
            style="width: 160px" />
        </ElFormItem>
        <ElFormItem>
          <ElButton type="primary" @click="handleSearch">搜索</ElButton>
          <ElButton @click="handleReset">重置</ElButton>
        </ElFormItem>
      </ElForm>
    </ElCard>

    <ElRow :gutter="16" class="mb-4">
      <ElCol :span="6">
        <ElCard shadow="never" class="stat-card">
          <ElStatistic title="总订单数" :value="stats.total_orders || 0" />
        </ElCard>
      </ElCol>
      <ElCol :span="6">
        <ElCard shadow="never" class="stat-card">
          <ElStatistic title="持仓中" :value="stats.open_orders || 0" />
        </ElCard>
      </ElCol>
      <ElCol :span="6">
        <ElCard shadow="never" class="stat-card">
          <ElStatistic title="总盈亏" :value="parseFloat(stats.total_pnl || 0)" :precision="2" prefix="$" />
        </ElCard>
      </ElCol>
      <ElCol :span="6">
        <ElCard shadow="never" class="stat-card">
          <ElStatistic title="总手续费" :value="parseFloat(stats.total_commission || 0)" :precision="2" prefix="$" />
        </ElCard>
      </ElCol>
    </ElRow>

    <ElCard shadow="never">
      <div class="table-header flex-between mb-4">
        <span class="font-bold">交易流水</span>
        <ElButton :icon="Refresh" circle @click="loadData" />
      </div>

      <ElTable :data="tableData" v-loading="loading" border stripe>
        <ElTableColumn type="index" width="55" label="序号" />
        <ElTableColumn label="用户" width="160">
          <template #default="{ row }">
            {{ row.user_nickname || row.user_email || `ID:${row.user_id}` }}
          </template>
        </ElTableColumn>
        <ElTableColumn prop="flow_type" label="类型" width="100">
          <template #default="{ row }">
            <ElTag :type="getFlowTagType(row.flow_type)" size="small">{{ getFlowTypeText(row.flow_type) }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="金额" width="120">
          <template #default="{ row }">
            <span :class="parseFloat(row.amount) >= 0 ? 'text-success' : 'text-danger'" class="font-bold">
              {{ parseFloat(row.amount) >= 0 ? '+' : '' }}{{ parseFloat(row.amount).toFixed(2) }}
            </span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="balance_before" label="变动前余额" width="120">
          <template #default="{ row }">${{ parseFloat(row.balance_before).toFixed(2) }}</template>
        </ElTableColumn>
        <ElTableColumn prop="balance_after" label="变动后余额" width="120">
          <template #default="{ row }">${{ parseFloat(row.balance_after).toFixed(2) }}</template>
        </ElTableColumn>
        <ElTableColumn prop="account_type" label="账户" width="60">
          <template #default="{ row }">{{ row.account_type === 'real' ? '实盘' : '模拟' }}</template>
        </ElTableColumn>
        <ElTableColumn prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <ElTableColumn prop="created_at" label="时间" width="170" />
      </ElTable>

      <div class="pagination-wrap mt-4 flex-end">
        <ElPagination v-model:current-page="pagination.page" v-model:page-size="pagination.limit"
          :total="pagination.total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next" background
          @size-change="(s: number) => { pagination.limit = s; pagination.page = 1; loadData() }"
          @current-change="(p: number) => { pagination.page = p; loadData() }" />
      </div>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
import { Refresh } from '@element-plus/icons-vue'
import { fetchTradeFlows, fetchTradeStatistics } from '@/api/admin-trade'

defineOptions({ name: 'TradeFlows' })

const loading = ref(false)
const tableData = ref<any[]>([])
const stats = ref<any>({})

const searchForm = ref({
  userId: '',
  flowType: '',
  accountType: '',
  startDate: '',
  endDate: ''
})

const pagination = reactive({ page: 1, limit: 20, total: 0 })

const FLOW_TYPE_MAP: Record<string, { label: string; type: string }> = {
  open: { label: '开仓', type: 'primary' },
  close: { label: '平仓', type: 'success' },
  commission: { label: '手续费', type: 'warning' },
  swap: { label: '隔夜费', type: 'info' },
  deposit: { label: '入金', type: 'success' },
  withdraw: { label: '出金', type: 'danger' },
  bonus: { label: '赠金', type: 'primary' },
  adjust: { label: '调整', type: 'warning' },
}

function getFlowTypeText(t: string) { return FLOW_TYPE_MAP[t]?.label || t }
function getFlowTagType(t: string) { return (FLOW_TYPE_MAP[t]?.type || 'info') as any }

async function loadData() {
  loading.value = true
  try {
    const params: any = { page: pagination.page, pageSize: pagination.limit }
    if (searchForm.value.userId) params.userId = searchForm.value.userId
    if (searchForm.value.flowType) params.flowType = searchForm.value.flowType
    if (searchForm.value.accountType) params.accountType = searchForm.value.accountType
    if (searchForm.value.startDate) params.startDate = searchForm.value.startDate
    if (searchForm.value.endDate) params.endDate = searchForm.value.endDate

    const res = await fetchTradeFlows(params)
    if (res?.list) {
      tableData.value = res.list
      pagination.total = res.pagination?.total || 0
    }
  } catch { /* handled */ } finally {
    loading.value = false
  }
}

async function loadStats() {
  try {
    const res = await fetchTradeStatistics()
    if (res?.overview) stats.value = res.overview
  } catch { /* handled */ }
}

function handleSearch() { pagination.page = 1; loadData() }

function handleReset() {
  searchForm.value = { userId: '', flowType: '', accountType: '', startDate: '', endDate: '' }
  pagination.page = 1
  loadData()
}

onMounted(() => {
  loadData()
  loadStats()
})
</script>

<style scoped>
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.flex-end { display: flex; justify-content: flex-end; }
.text-success { color: #67c23a; }
.text-danger { color: #f56c6c; }
.stat-card { text-align: center; }
</style>
