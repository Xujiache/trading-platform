<template>
  <div class="orders-page art-full-height">
    <ElCard class="mb-4" shadow="never">
      <ElForm :model="searchForm" inline>
        <ElFormItem label="用户ID">
          <ElInput v-model="searchForm.userId" placeholder="用户ID" clearable style="width: 120px" />
        </ElFormItem>
        <ElFormItem label="品种">
          <ElInput v-model="searchForm.symbol" placeholder="品种代码" clearable style="width: 120px" />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSelect v-model="searchForm.status" placeholder="全部" clearable style="width: 120px">
            <ElOption label="持仓中" value="open" />
            <ElOption label="已平仓" value="closed" />
            <ElOption label="已取消" value="cancelled" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="方向">
          <ElSelect v-model="searchForm.direction" placeholder="全部" clearable style="width: 100px">
            <ElOption label="买入" value="buy" />
            <ElOption label="卖出" value="sell" />
          </ElSelect>
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
        <span class="font-bold">订单列表</span>
        <ElButton :icon="Refresh" circle @click="loadData" />
      </div>

      <ElTable :data="tableData" v-loading="loading" border stripe row-key="id">
        <ElTableColumn prop="order_no" label="订单号" width="180" show-overflow-tooltip />
        <ElTableColumn prop="user_email" label="用户" width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <span>{{ row.user_nickname || row.user_email || `ID:${row.user_id}` }}</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="symbol" label="品种" width="100">
          <template #default="{ row }">
            <span class="font-bold">{{ row.symbol }}</span>
          </template>
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
        <ElTableColumn prop="close_price" label="平仓价" width="110">
          <template #default="{ row }">{{ row.close_price ?? '-' }}</template>
        </ElTableColumn>
        <ElTableColumn prop="margin" label="保证金" width="100" />
        <ElTableColumn label="盈亏" width="100">
          <template #default="{ row }">
            <span v-if="row.status === 'closed'"
              :class="parseFloat(row.net_pnl || 0) >= 0 ? 'text-success' : 'text-danger'">
              {{ parseFloat(row.net_pnl || 0).toFixed(2) }}
            </span>
            <span v-else :class="parseFloat(row.floating_pnl || 0) >= 0 ? 'text-success' : 'text-danger'">
              {{ parseFloat(row.floating_pnl || 0).toFixed(2) }}
            </span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="status" label="状态" width="80">
          <template #default="{ row }">
            <ElTag :type="getStatusType(row.status)" size="small">{{ getStatusText(row.status) }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="account_type" label="账户" width="60">
          <template #default="{ row }">
            <ElTag :type="row.account_type === 'real' ? 'warning' : 'info'" size="small">
              {{ row.account_type === 'real' ? '实盘' : '模拟' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="opened_at" label="开仓时间" width="170" />
        <ElTableColumn label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <ElButton type="primary" link size="small" @click="showDetail(row)">详情</ElButton>
            <template v-if="row.status === 'open'">
              <ElButton type="warning" link size="small" @click="showModifyPrice(row)">改价</ElButton>
              <ElButton type="danger" link size="small" @click="handleClose(row)">平仓</ElButton>
              <ElButton type="info" link size="small" @click="handleCancel(row)">撤销</ElButton>
            </template>
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

    <ElCard shadow="never" class="mt-4">
      <div class="table-header flex-between mb-4">
        <span class="font-bold">活跃挂单</span>
        <ElButton :icon="Refresh" circle @click="loadPendings" />
      </div>

      <ElTable :data="pendingData" v-loading="pendingLoading" border stripe>
        <ElTableColumn prop="order_no" label="挂单号" width="180" show-overflow-tooltip />
        <ElTableColumn label="用户" width="140">
          <template #default="{ row }">{{ row.user_nickname || row.user_email || `ID:${row.user_id}` }}</template>
        </ElTableColumn>
        <ElTableColumn prop="symbol" label="品种" width="100" />
        <ElTableColumn prop="pending_type" label="挂单类型" width="100">
          <template #default="{ row }">
            <ElTag size="small">{{ getPendingTypeText(row.pending_type) }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="direction" label="方向" width="70">
          <template #default="{ row }">
            <ElTag :type="row.direction === 'buy' ? 'success' : 'danger'" size="small">
              {{ row.direction === 'buy' ? '买入' : '卖出' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="lots" label="手数" width="70" />
        <ElTableColumn prop="target_price" label="目标价" width="110" />
        <ElTableColumn label="现价" width="110">
          <template #default="{ row }">{{ row.direction === 'buy' ? row.currentAsk : row.currentBid }}</template>
        </ElTableColumn>
        <ElTableColumn prop="created_at" label="创建时间" width="170" />
        <ElTableColumn label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <ElButton type="danger" link size="small" @click="handleCancelPending(row)">撤销</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
    </ElCard>

    <ElDialog v-model="detailVisible" title="订单详情" width="600px">
      <template v-if="detailData">
        <ElDescriptions :column="2" border>
          <ElDescriptionsItem label="订单号">{{ detailData.order_no }}</ElDescriptionsItem>
          <ElDescriptionsItem label="用户">{{ detailData.user_nickname || detailData.user_email }}</ElDescriptionsItem>
          <ElDescriptionsItem label="品种">{{ detailData.symbol }} {{ detailData.symbol_name }}</ElDescriptionsItem>
          <ElDescriptionsItem label="方向">{{ detailData.direction === 'buy' ? '买入' : '卖出' }}</ElDescriptionsItem>
          <ElDescriptionsItem label="手数">{{ detailData.lots }}</ElDescriptionsItem>
          <ElDescriptionsItem label="杠杆">{{ detailData.leverage }}x</ElDescriptionsItem>
          <ElDescriptionsItem label="开仓价">{{ detailData.open_price }}</ElDescriptionsItem>
          <ElDescriptionsItem label="平仓价">{{ detailData.close_price ?? '-' }}</ElDescriptionsItem>
          <ElDescriptionsItem label="保证金">${{ detailData.margin }}</ElDescriptionsItem>
          <ElDescriptionsItem label="手续费">${{ detailData.commission }}</ElDescriptionsItem>
          <ElDescriptionsItem label="点差成本">${{ detailData.spread_cost }}</ElDescriptionsItem>
          <ElDescriptionsItem label="隔夜费">${{ detailData.swap_total }}</ElDescriptionsItem>
          <ElDescriptionsItem label="止损">{{ detailData.stop_loss ?? '未设置' }}</ElDescriptionsItem>
          <ElDescriptionsItem label="止盈">{{ detailData.take_profit ?? '未设置' }}</ElDescriptionsItem>
          <ElDescriptionsItem label="状态">{{ getStatusText(detailData.status) }}</ElDescriptionsItem>
          <ElDescriptionsItem label="平仓方式">{{ getCloseTypeText(detailData.close_type) }}</ElDescriptionsItem>
          <ElDescriptionsItem label="开仓时间" :span="2">{{ detailData.opened_at }}</ElDescriptionsItem>
          <ElDescriptionsItem label="平仓时间" :span="2">{{ detailData.closed_at ?? '-' }}</ElDescriptionsItem>
        </ElDescriptions>
      </template>
    </ElDialog>

    <ElDialog v-model="modifyPriceVisible" title="修改开仓价" width="400px">
      <ElForm>
        <ElFormItem label="新价格">
          <ElInputNumber v-model="newPrice" :precision="8" :min="0" style="width: 100%" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="modifyPriceVisible = false">取消</ElButton>
        <ElButton type="primary" @click="confirmModifyPrice">确定</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
import { Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { fetchTradeOrders, fetchTradeOrderDetail, adminCloseOrder, adminCancelOrder, adminModifyPrice, fetchPendingOrders, adminCancelPending } from '@/api/admin-trade'
import type { TradeOrder } from '@/api/admin-trade'

defineOptions({ name: 'TradeOrders' })

const loading = ref(false)
const tableData = ref<TradeOrder[]>([])
const detailVisible = ref(false)
const detailData = ref<TradeOrder | null>(null)
const modifyPriceVisible = ref(false)
const newPrice = ref(0)
let modifyingOrderId = 0

const pendingData = ref<any[]>([])
const pendingLoading = ref(false)

const searchForm = ref({
  userId: '',
  symbol: '',
  status: '',
  direction: '',
  accountType: ''
})

const pagination = reactive({ page: 1, limit: 20, total: 0 })

function getStatusText(s: string) {
  const map: Record<string, string> = { open: '持仓中', closed: '已平仓', cancelled: '已取消' }
  return map[s] || s
}

function getStatusType(s: string) {
  const map: Record<string, string> = { open: 'success', closed: 'info', cancelled: 'warning' }
  return (map[s] || 'info') as any
}

function getCloseTypeText(t: string | null) {
  if (!t) return '-'
  const map: Record<string, string> = {
    manual: '手动', stop_loss: '止损', take_profit: '止盈',
    admin: '管理员', trailing_stop: '移动止损', force_close: '强平'
  }
  return map[t] || t
}

async function loadData() {
  loading.value = true
  try {
    const params: any = { page: pagination.page, pageSize: pagination.limit }
    if (searchForm.value.userId) params.userId = searchForm.value.userId
    if (searchForm.value.symbol) params.symbol = searchForm.value.symbol
    if (searchForm.value.status) params.status = searchForm.value.status
    if (searchForm.value.direction) params.direction = searchForm.value.direction
    if (searchForm.value.accountType) params.accountType = searchForm.value.accountType

    const res = await fetchTradeOrders(params)
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
  searchForm.value = { userId: '', symbol: '', status: '', direction: '', accountType: '' }
  pagination.page = 1
  loadData()
}

async function showDetail(row: TradeOrder) {
  try {
    const res = await fetchTradeOrderDetail(row.id)
    detailData.value = res as any
    detailVisible.value = true
  } catch { /* handled */ }
}

function handleClose(row: TradeOrder) {
  ElMessageBox.confirm(`确定要平仓订单 ${row.order_no} 吗？`, '管理员平仓', {
    type: 'warning', confirmButtonText: '确定平仓', cancelButtonText: '取消'
  }).then(async () => {
    await adminCloseOrder(row.id)
    loadData()
  }).catch(() => {})
}

function handleCancel(row: TradeOrder) {
  ElMessageBox.confirm(`确定要撤销订单 ${row.order_no} 吗？持仓中订单将做平仓处理。`, '撤销订单', {
    type: 'warning', confirmButtonText: '确定撤销', cancelButtonText: '取消'
  }).then(async () => {
    await adminCancelOrder(row.id)
    loadData()
  }).catch(() => {})
}

function showModifyPrice(row: TradeOrder) {
  modifyingOrderId = row.id
  newPrice.value = parseFloat(String(row.open_price))
  modifyPriceVisible.value = true
}

async function confirmModifyPrice() {
  try {
    await adminModifyPrice(modifyingOrderId, newPrice.value)
    modifyPriceVisible.value = false
    loadData()
  } catch { /* handled */ }
}

function getPendingTypeText(t: string) {
  const map: Record<string, string> = {
    buy_limit: '买入限价', buy_stop: '买入止损',
    sell_limit: '卖出限价', sell_stop: '卖出止损'
  }
  return map[t] || t
}

async function loadPendings() {
  pendingLoading.value = true
  try {
    const res = await fetchPendingOrders({ status: 'active', pageSize: 50 })
    if (res?.list) pendingData.value = res.list
  } catch { /* handled */ } finally {
    pendingLoading.value = false
  }
}

function handleCancelPending(row: any) {
  ElMessageBox.confirm(`确定要撤销挂单 ${row.order_no} 吗？`, '撤销挂单', {
    type: 'warning'
  }).then(async () => {
    await adminCancelPending(row.id)
    loadPendings()
  }).catch(() => {})
}

onMounted(() => { loadData(); loadPendings() })
</script>

<style scoped>
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.flex-end { display: flex; justify-content: flex-end; }
.text-success { color: #67c23a; }
.text-danger { color: #f56c6c; }
</style>
