<template>
  <div class="sim-monitor-page art-full-height">
    <ElCard class="mb-4" shadow="never">
      <div class="flex-between">
        <ElSpace wrap>
          <ElTag type="primary">活跃自控品种: {{ statusList.length }}</ElTag>
          <ElSwitch v-model="autoRefresh" active-text="自动刷新(2s)" inactive-text="手动" />
          <ElButton :icon="Refresh" @click="loadStatus">刷新</ElButton>
          <ElButton type="danger" plain @click="handleAllToReal" :disabled="statusList.length === 0">
            批量切回 real 兜底
          </ElButton>
        </ElSpace>
        <ElSpace>
          <span class="muted">最后更新: {{ lastRefreshText }}</span>
        </ElSpace>
      </div>
    </ElCard>

    <ElTable :data="statusList" v-loading="loading" border stripe>
      <ElTableColumn type="index" width="55" label="序号" />
      <ElTableColumn prop="symbol" label="品种" width="110" />
      <ElTableColumn label="当前价" width="120">
        <template #default="{ row }">
          <span :class="priceDirClass(row.symbol)">{{ formatPrice(row.currentBid) }}</span>
        </template>
      </ElTableColumn>
      <ElTableColumn label="中枢" width="120">
        <template #default="{ row }">{{ formatPrice(row.centerPrice) }}</template>
      </ElTableColumn>
      <ElTableColumn label="区间" width="200">
        <template #default="{ row }">
          {{ formatPrice(row.lowerBound) }} ~ {{ formatPrice(row.upperBound) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="趋势" width="130">
        <template #default="{ row }">
          <ElTag :type="trendTagType(row.trendDirection)" size="small">{{ trendLabel(row.trendDirection) }}</ElTag>
          <span class="muted ml-1">{{ Number(row.trendStrength).toFixed(2) }}</span>
        </template>
      </ElTableColumn>
      <ElTableColumn label="波动" width="100">
        <template #default="{ row }">
          <ElTag size="small">{{ volLabel(row.volatilityLevel) }}</ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn label="距边界%" width="100">
        <template #default="{ row }">
          <span :class="edgeClass(row.edgeDistancePct)">{{ row.edgeDistancePct != null ? row.edgeDistancePct : '--' }}</span>
        </template>
      </ElTableColumn>
      <ElTableColumn label="Tick频率" width="100">
        <template #default="{ row }">{{ row.tickIntervalMs }}ms</template>
      </ElTableColumn>
      <ElTableColumn label="已生成ticks" width="120">
        <template #default="{ row }">{{ row.tickCount }}</template>
      </ElTableColumn>
      <ElTableColumn label="迷你走势" width="220">
        <template #default="{ row }">
          <div :ref="(el) => setChartRef(el, row.symbol)" style="width: 200px; height: 50px"></div>
        </template>
      </ElTableColumn>
      <ElTableColumn label="操作" width="300" fixed="right">
        <template #default="{ row }">
          <ElButton link size="small" @click="changeTrend(row, 'up')">上涨</ElButton>
          <ElButton link size="small" @click="changeTrend(row, 'sideways')">震荡</ElButton>
          <ElButton link size="small" @click="changeTrend(row, 'down')">下跌</ElButton>
          <ElButton type="warning" link size="small" @click="handleReset(row)">重置中枢</ElButton>
          <ElButton type="success" link size="small" @click="handleNudge(row)">推价</ElButton>
          <ElButton type="danger" link size="small" @click="handleRevertReal(row)">切回real</ElButton>
        </template>
      </ElTableColumn>
    </ElTable>
  </div>
</template>

<script setup lang="ts">
import { Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as echarts from 'echarts'
import {
  fetchSimStatus,
  fetchSimConfig,
  saveSimConfig,
  resetSimCenter,
  nudgeSimPrice,
  updatePriceSource,
  fetchSymbolList,
} from '@/api/admin-symbols'
import type { SimRuntime, TrendDirection } from '@/api/admin-symbols'

defineOptions({ name: 'SimMonitor' })

const loading = ref(false)
const autoRefresh = ref(true)
const statusList = ref<SimRuntime[]>([])
const lastRefreshAt = ref<number>(0)
const lastBidMap = reactive<Record<string, number>>({})
const prevBidMap = reactive<Record<string, number>>({})
const priceHistory = reactive<Record<string, number[]>>({})
const chartMap: Record<string, echarts.ECharts> = {}
const chartEls: Record<string, HTMLElement> = {}
let refreshTimer: any = null

const MAX_HISTORY = 60

const lastRefreshText = computed(() => {
  if (!lastRefreshAt.value) return '--'
  const diff = Math.floor((Date.now() - lastRefreshAt.value) / 1000)
  return `${diff}s 前`
})

function formatPrice(p: number | null | undefined) {
  if (p == null) return '--'
  return Number(p).toFixed(4).replace(/\.?0+$/, '')
}

function priceDirClass(symbol: string) {
  const prev = prevBidMap[symbol]
  const cur = lastBidMap[symbol]
  if (prev == null || cur == null) return ''
  if (cur > prev) return 'up'
  if (cur < prev) return 'down'
  return ''
}

function edgeClass(edge: number | null) {
  if (edge == null) return ''
  if (edge < 10) return 'down'
  if (edge < 25) return 'warn'
  return ''
}

function trendLabel(d: TrendDirection) {
  return { up: '上涨', down: '下跌', sideways: '震荡' }[d] || d
}
function trendTagType(d: TrendDirection) {
  return ({ up: 'success', down: 'danger', sideways: 'info' }[d] || 'info') as any
}
function volLabel(v: string) {
  return { low: '低', medium: '中', high: '高', custom: '定制' }[v] || v
}

function setChartRef(el: any, symbol: string) {
  if (!el) return
  chartEls[symbol] = el as HTMLElement
  nextTick(() => ensureChart(symbol))
}

function ensureChart(symbol: string) {
  const el = chartEls[symbol]
  if (!el) return
  if (!chartMap[symbol]) {
    chartMap[symbol] = echarts.init(el)
  }
  const data = priceHistory[symbol] || []
  chartMap[symbol].setOption({
    grid: { left: 0, right: 0, top: 0, bottom: 0 },
    xAxis: { type: 'category', show: false, data: data.map((_, i) => i) },
    yAxis: { type: 'value', show: false, scale: true },
    tooltip: { show: false },
    series: [{
      type: 'line',
      data,
      smooth: true,
      symbol: 'none',
      lineStyle: { width: 1.5 },
      areaStyle: { opacity: 0.2 },
    }],
  })
}

function recordHistory(symbol: string, price: number) {
  if (!priceHistory[symbol]) priceHistory[symbol] = []
  priceHistory[symbol].push(price)
  if (priceHistory[symbol].length > MAX_HISTORY) priceHistory[symbol].shift()
  ensureChart(symbol)
}

async function loadStatus() {
  loading.value = true
  try {
    const res = await fetchSimStatus()
    const list = (res?.list || []) as SimRuntime[]
    statusList.value = list
    for (const s of list) {
      if (s.currentBid != null) {
        prevBidMap[s.symbol] = lastBidMap[s.symbol] ?? s.currentBid
        lastBidMap[s.symbol] = s.currentBid
        recordHistory(s.symbol, s.currentBid)
      }
    }
    lastRefreshAt.value = Date.now()
  } catch {
    // handled
  } finally {
    loading.value = false
  }
}

function startAutoRefresh() {
  stopAutoRefresh()
  if (!autoRefresh.value) return
  refreshTimer = setInterval(loadStatus, 2000)
}

function stopAutoRefresh() {
  if (refreshTimer) { clearInterval(refreshTimer); refreshTimer = null }
}

watch(autoRefresh, (v) => { v ? startAutoRefresh() : stopAutoRefresh() })

async function changeTrend(row: SimRuntime, dir: TrendDirection) {
  try {
    const detail = await fetchSimConfig(row.symbolId)
    if (!detail?.config) {
      ElMessage.warning('该品种暂无模拟配置')
      return
    }
    await saveSimConfig(row.symbolId, { ...detail.config, trend_direction: dir, enabled: 1 })
    ElMessage.success(`${row.symbol} 已切换为 ${trendLabel(dir)}`)
    loadStatus()
  } catch { /* handled */ }
}

async function handleReset(row: SimRuntime) {
  try {
    await ElMessageBox.confirm(`把 ${row.symbol} 中枢重置为当前价?`, '重置中枢', {
      type: 'warning', confirmButtonText: '确定', cancelButtonText: '取消',
    })
    const res = await resetSimCenter(row.symbolId)
    ElMessage.success(`重置成功, 新中枢 ${res?.center_price}`)
    loadStatus()
  } catch { /* cancel */ }
}

async function handleNudge(row: SimRuntime) {
  try {
    const { value } = await ElMessageBox.prompt(
      `推价 (+N / -N 为相对, 数值为绝对值)。当前: ${row.currentBid}`,
      `推价 ${row.symbol}`,
      { confirmButtonText: '确定', cancelButtonText: '取消', inputPattern: /^[-+]?\d+(\.\d+)?$/, inputErrorMessage: '请输入数字' }
    )
    const text = String(value).trim()
    const firstCh = text.charAt(0)
    const payload = (firstCh === '+' || firstCh === '-')
      ? { delta: parseFloat(text) }
      : { price: parseFloat(text) }
    const res = await nudgeSimPrice(row.symbolId, payload)
    ElMessage.success(`推价成功, 当前 ${res?.price}`)
  } catch { /* cancel */ }
}

async function handleRevertReal(row: SimRuntime) {
  try {
    await ElMessageBox.confirm(`把 ${row.symbol} 切回 real 真实行情源?`, '切回 real', {
      type: 'warning', confirmButtonText: '确定', cancelButtonText: '取消',
    })
    await updatePriceSource(row.symbolId, 'real')
    ElMessage.success(`${row.symbol} 已切回 real`)
    loadStatus()
  } catch { /* cancel */ }
}

async function handleAllToReal() {
  try {
    await ElMessageBox.confirm(
      `把全部 ${statusList.value.length} 个活跃自控品种批量切回 real? 此操作将立即停止所有自控引擎, 由外部行情/随机游走接管。`,
      '批量兜底',
      { type: 'error', confirmButtonText: '确定批量切换', cancelButtonText: '取消' }
    )
    const list = await fetchSymbolList({ pageSize: 500, price_source: 'custom' } as any)
    const customs = (list?.list || []).filter((s: any) => s.price_source !== 'real')
    let ok = 0
    for (const s of customs) {
      try {
        await updatePriceSource(s.id, 'real')
        ok += 1
      } catch { /* continue */ }
    }
    ElMessage.success(`批量切换完成, 成功 ${ok} / ${customs.length}`)
    loadStatus()
  } catch { /* cancel */ }
}

onMounted(() => {
  loadStatus()
  startAutoRefresh()
})

onBeforeUnmount(() => {
  stopAutoRefresh()
  for (const k in chartMap) {
    try { chartMap[k].dispose() } catch {}
  }
})
</script>

<style scoped>
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.up { color: var(--el-color-success); font-weight: 600; }
.down { color: var(--el-color-danger); font-weight: 600; }
.warn { color: var(--el-color-warning); font-weight: 600; }
.muted { color: var(--el-text-color-secondary); }
.ml-1 { margin-left: 4px; }
</style>
