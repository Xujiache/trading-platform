<template>
  <div class="positions-page art-full-height">
    <ElCard class="mb-4" shadow="never">
      <ElForm :model="searchForm" inline>
        <ElFormItem label="用户ID">
          <ElInput v-model="searchForm.userId" placeholder="用户ID" clearable style="width: 120px" />
        </ElFormItem>
        <ElFormItem label="品种">
          <ElInput v-model="searchForm.symbol" placeholder="品种代码" clearable style="width: 120px" />
        </ElFormItem>
        <ElFormItem label="账户">
          <ElSelect v-model="searchForm.accountType" placeholder="全部" clearable style="width: 100px">
            <ElOption label="实盘" value="real" />
            <ElOption label="模拟" value="demo" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem>
          <ElButton type="primary" @click="handleSearch">搜索</ElButton>
          <ElButton @click="handleReset">重置</ElButton>
        </ElFormItem>
      </ElForm>
    </ElCard>

    <ElCard shadow="never">
      <div class="table-header flex-between mb-4">
        <span class="font-bold">当前持仓 ({{ pagination.total }})</span>
        <ElButton :icon="Refresh" circle @click="loadData" />
      </div>

      <ElTable :data="tableData" v-loading="loading" border stripe>
        <ElTableColumn prop="order_no" label="订单号" width="180" show-overflow-tooltip />
        <ElTableColumn label="用户" width="140">
          <template #default="{ row }">
            {{ row.user_nickname || row.user_email || `ID:${row.user_id}` }}
          </template>
        </ElTableColumn>
        <ElTableColumn prop="symbol" label="品种" width="100">
          <template #default="{ row }"><span class="font-bold">{{ row.symbol }}</span></template>
        </ElTableColumn>
        <ElTableColumn prop="direction" label="方向" width="70">
          <template #default="{ row }">
            <ElTag :type="row.direction === 'buy' ? 'success' : 'danger'" size="small">
              {{ row.direction === 'buy' ? '买入' : '卖出' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="lots" label="手数" width="70" />
        <ElTableColumn prop="leverage" label="杠杆" width="60">
          <template #default="{ row }">{{ row.leverage }}x</template>
        </ElTableColumn>
        <ElTableColumn prop="open_price" label="开仓价" width="110" />
        <ElTableColumn label="现价" width="110">
          <template #default="{ row }">{{ row.currentPrice ?? '-' }}</template>
        </ElTableColumn>
        <ElTableColumn prop="margin" label="保证金" width="100" />
        <ElTableColumn label="浮动盈亏" width="110">
          <template #default="{ row }">
            <span :class="parseFloat(row.floating_pnl || 0) >= 0 ? 'text-success' : 'text-danger'" class="font-bold">
              {{ parseFloat(row.floating_pnl || 0) >= 0 ? '+' : '' }}{{ parseFloat(row.floating_pnl || 0).toFixed(2) }}
            </span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="stop_loss" label="止损" width="100">
          <template #default="{ row }">{{ row.stop_loss ?? '-' }}</template>
        </ElTableColumn>
        <ElTableColumn prop="take_profit" label="止盈" width="100">
          <template #default="{ row }">{{ row.take_profit ?? '-' }}</template>
        </ElTableColumn>
        <ElTableColumn prop="opened_at" label="开仓时间" width="170" />
        <ElTableColumn label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <ElButton type="danger" link size="small" @click="handleClose(row)">平仓</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>

      <div class="pagination-wrap mt-4 flex-end">
        <ElPagination v-model:current-page="pagination.page" v-model:page-size="pagination.limit"
          :total="pagination.total" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next" background
          @size-change="(s: number) => { pagination.limit = s; pagination.page = 1; loadData() }"
          @current-change="(p: number) => { pagination.page = p; loadData() }" />
      </div>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
import { Refresh } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'
import { fetchPositions, adminCloseOrder } from '@/api/admin-trade'
import type { TradeOrder } from '@/api/admin-trade'

defineOptions({ name: 'TradePositions' })

const loading = ref(false)
const tableData = ref<TradeOrder[]>([])
const searchForm = ref({ userId: '', symbol: '', accountType: '' })
const pagination = reactive({ page: 1, limit: 20, total: 0 })
let refreshTimer: ReturnType<typeof setInterval> | null = null

async function loadData() {
  loading.value = true
  try {
    const params: any = { page: pagination.page, pageSize: pagination.limit }
    if (searchForm.value.userId) params.userId = searchForm.value.userId
    if (searchForm.value.symbol) params.symbol = searchForm.value.symbol
    if (searchForm.value.accountType) params.accountType = searchForm.value.accountType

    const res = await fetchPositions(params)
    if (res?.list) {
      tableData.value = res.list
      pagination.total = res.pagination?.total || 0
    }
  } catch { /* handled */ } finally {
    loading.value = false
  }
}

function handleSearch() { pagination.page = 1; loadData() }

function handleReset() {
  searchForm.value = { userId: '', symbol: '', accountType: '' }
  pagination.page = 1
  loadData()
}

function handleClose(row: TradeOrder) {
  ElMessageBox.confirm(`确定要平仓 ${row.order_no} 吗？`, '管理员平仓', {
    type: 'warning'
  }).then(async () => {
    await adminCloseOrder(row.id)
    loadData()
  }).catch(() => {})
}

onMounted(() => {
  loadData()
  refreshTimer = setInterval(loadData, 5000)
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})
</script>

<style scoped>
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.flex-end { display: flex; justify-content: flex-end; }
.text-success { color: #67c23a; }
.text-danger { color: #f56c6c; }
</style>
