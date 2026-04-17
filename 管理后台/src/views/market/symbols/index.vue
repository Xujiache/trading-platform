<template>
  <div class="symbols-page art-full-height">
    <SymbolSearch v-model="searchForm" @search="handleSearch" @reset="handleReset" />

    <ElCard class="art-table-card" shadow="never">
      <div class="table-header flex-between mb-4">
        <ElSpace wrap>
          <ElButton type="primary" @click="showDialog('add')">新增品种</ElButton>
          <ElButton @click="router.push('/market/sim-monitor')">自控引擎监控</ElButton>
        </ElSpace>
        <ElButton :icon="Refresh" circle @click="loadData" />
      </div>

      <ElTable :data="tableData" v-loading="loading" border stripe>
        <ElTableColumn type="index" width="55" label="序号" />
        <ElTableColumn prop="symbol" label="品种代码" width="110" />
        <ElTableColumn prop="name" label="品种名称" width="130" />
        <ElTableColumn prop="category" label="分类" width="90">
          <template #default="{ row }">
            <ElTag :type="getCategoryType(row.category)">{{ getCategoryLabel(row.category) }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="price_source" label="行情源" width="100">
          <template #default="{ row }">
            <ElTag :type="getSourceTagType(row.price_source)">{{ getSourceLabel(row.price_source) }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="status" label="状态" width="80">
          <template #default="{ row }">
            <ElSwitch :model-value="row.status === 'active'" @change="(val) => handleStatusChange(row, Boolean(val))"
              inline-prompt active-text="启" inactive-text="停" />
          </template>
        </ElTableColumn>
        <ElTableColumn label="实时价" width="130">
          <template #default="{ row }">
            <span v-if="livePrices[row.symbol]">
              <span :class="priceDirClass(row.symbol)">{{ formatPrice(livePrices[row.symbol].bid, row.price_decimals) }}</span>
            </span>
            <span v-else class="muted">--</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="is_hot" label="热门" width="70">
          <template #default="{ row }">
            <ElTag v-if="row.is_hot" type="danger" size="small">热</ElTag>
            <span v-else>-</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="spread_mode" label="点差" width="100">
          <template #default="{ row }">
            {{ row.spread_mode === 'fixed' ? `固定 ${row.spread_fixed}` : `浮动 ${row.spread_min}-${row.spread_max}` }}
          </template>
        </ElTableColumn>
        <ElTableColumn prop="max_leverage" label="杠杆" width="80">
          <template #default="{ row }">1:{{ row.max_leverage }}</template>
        </ElTableColumn>
        <ElTableColumn prop="fee_value" label="手续费" width="90">
          <template #default="{ row }">{{ row.fee_value }}/手</template>
        </ElTableColumn>
        <ElTableColumn prop="sort_order" label="排序" width="70" sortable />
        <ElTableColumn label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <ElButton type="primary" link size="small" @click="showDialog('edit', row)">编辑</ElButton>
            <ElButton v-if="row.price_source !== 'real'" type="warning" link size="small"
              @click="handleResetCenter(row)">重置中枢</ElButton>
            <ElButton v-if="row.price_source !== 'real'" type="success" link size="small"
              @click="handleNudge(row)">推价</ElButton>
            <ElButton type="danger" link size="small" @click="handleDelete(row)">删除</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>

      <div class="pagination-wrap mt-4 flex-end">
        <ElPagination v-model:current-page="pagination.page" v-model:page-size="pagination.limit"
          :total="pagination.total" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next" background
          @size-change="handleSizeChange" @current-change="handlePageChange" />
      </div>
    </ElCard>

    <SymbolDialog v-model:visible="dialogVisible" :type="dialogType" :symbol-data="currentSymbolData"
      @submit="handleDialogSubmit" />
  </div>
</template>

<script setup lang="ts">
import { Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import {
  fetchSymbolList, createSymbol, updateSymbol, updateSymbolStatus, deleteSymbol,
  resetSimCenter, nudgeSimPrice,
} from '@/api/admin-symbols'
import type { TradingSymbol, SymbolSearchParams, PriceSource } from '@/api/admin-symbols'
import type { DialogType } from '@/types'
import SymbolSearch from './modules/symbol-search.vue'
import SymbolDialog from './modules/symbol-dialog.vue'

defineOptions({ name: 'TradingSymbols' })

const router = useRouter()
const loading = ref(false)
const tableData = ref<TradingSymbol[]>([])
const dialogVisible = ref(false)
const dialogType = ref<DialogType>('add')
const currentSymbolData = ref<Partial<TradingSymbol>>({})

type Tick = { bid: number; ask: number; change?: number; prevBid?: number }
const livePrices = reactive<Record<string, Tick>>({})
let ws: WebSocket | null = null
let wsReconnectTimer: any = null

const searchForm = ref<{
  keyword: string
  category: string
  status: string
  price_source: '' | PriceSource
}>({
  keyword: '',
  category: '',
  status: '',
  price_source: '',
})

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

const CATEGORY_MAP: Record<string, { label: string; type: string }> = {
  precious_metal: { label: '贵金属', type: 'warning' },
  energy: { label: '能源', type: 'danger' },
  forex: { label: '外汇', type: 'success' },
}

const SOURCE_MAP: Record<string, { label: string; type: string }> = {
  real: { label: '真实', type: 'info' },
  custom: { label: '自控', type: 'primary' },
  hybrid: { label: '混合', type: 'warning' },
}

function getCategoryLabel(cat: string) { return CATEGORY_MAP[cat]?.label || cat }
function getCategoryType(cat: string) { return (CATEGORY_MAP[cat]?.type || 'info') as any }
function getSourceLabel(src: string) { return SOURCE_MAP[src]?.label || src }
function getSourceTagType(src: string) { return (SOURCE_MAP[src]?.type || 'info') as any }

function formatPrice(p: number, decimals = 2) {
  if (p == null) return '--'
  return Number(p).toFixed(decimals)
}

function priceDirClass(symbol: string) {
  const t = livePrices[symbol]
  if (!t || t.prevBid == null) return ''
  if (t.bid > t.prevBid) return 'up'
  if (t.bid < t.prevBid) return 'down'
  return ''
}

async function loadData() {
  loading.value = true
  try {
    const params: SymbolSearchParams = {
      page: pagination.page,
      pageSize: pagination.limit,
      keyword: searchForm.value.keyword || undefined,
      category: searchForm.value.category || undefined,
      status: searchForm.value.status || undefined,
      price_source: searchForm.value.price_source || undefined,
    }
    const res = await fetchSymbolList(params)
    if (res && res.list) {
      tableData.value = res.list
      pagination.total = res.pagination?.total || 0
      subscribeWs(res.list.map((s: TradingSymbol) => s.symbol))
    }
  } catch {
    // handled by interceptor
  } finally {
    loading.value = false
  }
}

function handleSearch() { pagination.page = 1; loadData() }
function handleReset() {
  searchForm.value = { keyword: '', category: '', status: '', price_source: '' }
  pagination.page = 1
  loadData()
}
function handleSizeChange(size: number) { pagination.limit = size; pagination.page = 1; loadData() }
function handlePageChange(page: number) { pagination.page = page; loadData() }

function showDialog(type: DialogType, row?: TradingSymbol) {
  dialogType.value = type
  currentSymbolData.value = row ? { ...row } : {}
  nextTick(() => { dialogVisible.value = true })
}

async function handleDialogSubmit(data: Partial<TradingSymbol>) {
  try {
    if (dialogType.value === 'add') {
      await createSymbol(data)
    } else {
      await updateSymbol(data.id!, data)
    }
    dialogVisible.value = false
    loadData()
  } catch { /* handled */ }
}

async function handleStatusChange(row: TradingSymbol, val: boolean) {
  try {
    await updateSymbolStatus(row.id, val ? 'active' : 'inactive')
    loadData()
  } catch { /* handled */ }
}

function handleDelete(row: TradingSymbol) {
  ElMessageBox.confirm(`确定要删除品种 ${row.symbol} 吗？如有关联数据将自动禁用。`, '删除品种', {
    type: 'warning',
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
  }).then(async () => {
    await deleteSymbol(row.id)
    loadData()
  }).catch(() => {})
}

async function handleResetCenter(row: TradingSymbol) {
  try {
    await ElMessageBox.confirm(`把 ${row.symbol} 的中枢价重置为当前价?`, '重置中枢', {
      type: 'warning', confirmButtonText: '确定', cancelButtonText: '取消',
    })
    const res = await resetSimCenter(row.id)
    ElMessage.success(`已重置, 新中枢 ${res?.center_price}`)
  } catch { /* cancel or handled */ }
}

async function handleNudge(row: TradingSymbol) {
  try {
    const { value } = await ElMessageBox.prompt(
      `推价到指定值, 或输入 +N/-N 相对当前价调整。当前: ${livePrices[row.symbol]?.bid ?? '--'}`,
      `推价 ${row.symbol}`,
      { confirmButtonText: '确定', cancelButtonText: '取消', inputPattern: /^[-+]?\d+(\.\d+)?$/, inputErrorMessage: '请输入数字' }
    )
    const text = String(value).trim()
    const firstCh = text.charAt(0)
    const payload = (firstCh === '+' || firstCh === '-')
      ? { delta: parseFloat(text) }
      : { price: parseFloat(text) }
    const res = await nudgeSimPrice(row.id, payload)
    ElMessage.success(`推价成功, 当前 ${res?.price}`)
  } catch { /* cancel or handled */ }
}

// ===== WebSocket 实时价 =====
function getWsUrl() {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:'
  const host = location.host
  return `${proto}//${host}/ws/market`
}

function subscribeWs(symbols: string[]) {
  if (!symbols.length) return
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    connectWs(() => sendSubscribe(symbols))
  } else {
    sendSubscribe(symbols)
  }
}

function sendSubscribe(symbols: string[]) {
  try { ws?.send(JSON.stringify({ type: 'subscribe', data: { symbols } })) } catch { /* ignore */ }
}

function connectWs(onOpen?: () => void) {
  try {
    ws = new WebSocket(getWsUrl())
    ws.onopen = () => { onOpen?.() }
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data)
        if (msg.type === 'tick' && msg.data?.symbol) {
          const s = msg.data.symbol
          const prev = livePrices[s]?.bid
          livePrices[s] = { bid: Number(msg.data.bid), ask: Number(msg.data.ask), prevBid: prev }
        }
      } catch { /* ignore */ }
    }
    ws.onclose = () => {
      ws = null
      clearTimeout(wsReconnectTimer)
      wsReconnectTimer = setTimeout(() => {
        const syms = tableData.value.map((s) => s.symbol)
        if (syms.length) subscribeWs(syms)
      }, 3000)
    }
    ws.onerror = () => { /* close handler 会触发重连 */ }
  } catch { /* ignore */ }
}

onMounted(() => {
  loadData()
})

onBeforeUnmount(() => {
  clearTimeout(wsReconnectTimer)
  if (ws) { try { ws.close() } catch { /* ignore */ } ; ws = null }
})
</script>

<style scoped>
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.flex-end { display: flex; justify-content: flex-end; }
.up { color: var(--el-color-success); font-weight: 600; }
.down { color: var(--el-color-danger); font-weight: 600; }
.muted { color: var(--el-text-color-secondary); }
</style>
