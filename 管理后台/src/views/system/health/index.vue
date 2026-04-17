<template>
  <div class="art-full-height">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-medium">系统监控</h3>
      <div>
        <ElTag :type="autoRefresh ? 'success' : 'info'" class="mr-2">{{ autoRefresh ? '自动刷新中' : '已暂停' }}</ElTag>
        <ElButton :type="autoRefresh ? 'warning' : 'primary'" size="small" @click="toggleAutoRefresh">
          {{ autoRefresh ? '暂停' : '开启自动刷新' }}
        </ElButton>
        <ElButton type="primary" size="small" @click="loadAll" :loading="loading">立即刷新</ElButton>
      </div>
    </div>

    <ElRow :gutter="16" class="mb-4">
      <ElCol :span="6">
        <ElCard shadow="hover">
          <template #header><span>系统状态</span></template>
          <div class="text-center">
            <ElTag :type="statusColor" size="large" effect="dark" style="font-size: 16px; padding: 8px 24px">
              {{ statusText }}
            </ElTag>
            <p class="text-gray-400 text-xs mt-2">{{ health?.timestamp || '-' }}</p>
          </div>
        </ElCard>
      </ElCol>
      <ElCol :span="6">
        <ElCard shadow="hover">
          <template #header><span>数据库</span></template>
          <div class="text-center">
            <ElTag :type="health?.components?.database?.status === 'up' ? 'success' : 'danger'" size="large">
              {{ health?.components?.database?.status === 'up' ? '正常' : '异常' }}
            </ElTag>
            <p class="text-gray-400 text-xs mt-2" v-if="health?.components?.database?.latencyMs">
              延迟: {{ health.components.database.latencyMs }}ms
            </p>
          </div>
        </ElCard>
      </ElCol>
      <ElCol :span="6">
        <ElCard shadow="hover">
          <template #header><span>Redis</span></template>
          <div class="text-center">
            <ElTag :type="health?.components?.redis?.status === 'up' ? 'success' : 'danger'" size="large">
              {{ health?.components?.redis?.status === 'up' ? '正常' : '异常' }}
            </ElTag>
            <p class="text-gray-400 text-xs mt-2" v-if="health?.components?.redis?.latencyMs">
              延迟: {{ health.components.redis.latencyMs }}ms
            </p>
          </div>
        </ElCard>
      </ElCol>
      <ElCol :span="6">
        <ElCard shadow="hover">
          <template #header><span>行情源</span></template>
          <div class="text-center">
            <ElTag :type="health?.components?.marketMonitor?.isHealthy ? 'success' : 'warning'" size="large">
              {{ health?.components?.marketMonitor?.isHealthy ? '正常' : '停滞' }}
            </ElTag>
            <p class="text-gray-400 text-xs mt-2" v-if="health?.components?.marketMonitor?.lastUpdateTime">
              最后更新: {{ health.components.marketMonitor.lastUpdateTime }}
            </p>
          </div>
        </ElCard>
      </ElCol>
    </ElRow>

    <ElRow :gutter="16" class="mb-4">
      <ElCol :span="12">
        <ElCard shadow="never">
          <template #header><span>数据库连接池</span></template>
          <ElDescriptions :column="2" border v-if="connData?.database">
            <ElDescriptionsItem label="总连接数">{{ connData.database.total }}</ElDescriptionsItem>
            <ElDescriptionsItem label="空闲连接">{{ connData.database.idle }}</ElDescriptionsItem>
            <ElDescriptionsItem label="活跃连接">{{ connData.database.active }}</ElDescriptionsItem>
            <ElDescriptionsItem label="等待队列">{{ connData.database.waiting }}</ElDescriptionsItem>
            <ElDescriptionsItem label="连接上限">{{ connData.database.config?.connectionLimit }}</ElDescriptionsItem>
          </ElDescriptions>
          <ElEmpty v-else description="暂无数据" />
        </ElCard>
      </ElCol>
      <ElCol :span="12">
        <ElCard shadow="never">
          <template #header><span>Redis 状态</span></template>
          <ElDescriptions :column="2" border v-if="connData?.redis">
            <ElDescriptionsItem label="状态">
              <ElTag :type="connData.redis.status === 'up' ? 'success' : 'danger'" size="small">{{ connData.redis.status }}</ElTag>
            </ElDescriptionsItem>
            <ElDescriptionsItem label="已连接客户端">{{ connData.redis.connectedClients }}</ElDescriptionsItem>
            <ElDescriptionsItem label="阻塞客户端">{{ connData.redis.blockedClients }}</ElDescriptionsItem>
            <ElDescriptionsItem label="已用内存">{{ connData.redis.usedMemory }}</ElDescriptionsItem>
          </ElDescriptions>
          <ElEmpty v-else description="暂无数据" />
        </ElCard>
      </ElCol>
    </ElRow>

    <ElRow :gutter="16" class="mb-4">
      <ElCol :span="12">
        <ElCard shadow="never">
          <template #header><span>系统资源</span></template>
          <ElDescriptions :column="2" border v-if="health?.components?.system">
            <ElDescriptionsItem label="运行时间">{{ formatUptime(health.components.system.uptime) }}</ElDescriptionsItem>
            <ElDescriptionsItem label="进程PID">{{ health.components.system.pid }}</ElDescriptionsItem>
            <ElDescriptionsItem label="Node版本">{{ health.components.system.nodeVersion }}</ElDescriptionsItem>
            <ElDescriptionsItem label="平台">{{ health.components.system.platform }}</ElDescriptionsItem>
            <ElDescriptionsItem label="堆内存(已用)">{{ formatBytes(health.components.system.memoryUsage?.heapUsed) }}</ElDescriptionsItem>
            <ElDescriptionsItem label="堆内存(总计)">{{ formatBytes(health.components.system.memoryUsage?.heapTotal) }}</ElDescriptionsItem>
            <ElDescriptionsItem label="RSS内存">{{ formatBytes(health.components.system.memoryUsage?.rss) }}</ElDescriptionsItem>
            <ElDescriptionsItem label="外部内存">{{ formatBytes(health.components.system.memoryUsage?.external) }}</ElDescriptionsItem>
          </ElDescriptions>
        </ElCard>
      </ElCol>
      <ElCol :span="12">
        <ElCard shadow="never">
          <template #header><span>行情源监控详情</span></template>
          <ElDescriptions :column="2" border v-if="health?.components?.marketMonitor">
            <ElDescriptionsItem label="监控运行">
              <ElTag :type="health.components.marketMonitor.isRunning ? 'success' : 'danger'" size="small">
                {{ health.components.marketMonitor.isRunning ? '运行中' : '已停止' }}
              </ElTag>
            </ElDescriptionsItem>
            <ElDescriptionsItem label="启动时间">{{ health.components.marketMonitor.startedAt || '-' }}</ElDescriptionsItem>
            <ElDescriptionsItem label="重启次数">{{ health.components.marketMonitor.restartAttempts }}</ElDescriptionsItem>
            <ElDescriptionsItem label="停滞时长">
              {{ health.components.marketMonitor.staleDurationMs ? Math.floor(health.components.marketMonitor.staleDurationMs / 1000) + 's' : '-' }}
            </ElDescriptionsItem>
          </ElDescriptions>
          <div v-if="health?.components?.marketMonitor?.recentRecoveries?.length" class="mt-3">
            <h4 class="text-sm mb-2">恢复历史</h4>
            <ElTable :data="health.components.marketMonitor.recentRecoveries" size="small" border stripe max-height="200">
              <ElTableColumn prop="time" label="时间" width="180" />
              <ElTableColumn prop="result" label="结果" width="100">
                <template #default="{ row }">
                  <ElTag :type="row.result === 'success' ? 'success' : 'danger'" size="small">{{ row.result }}</ElTag>
                </template>
              </ElTableColumn>
              <ElTableColumn prop="error" label="错误" />
            </ElTable>
          </div>
        </ElCard>
      </ElCol>
    </ElRow>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { fetchSystemHealth, fetchConnectionStatus, type HealthData, type ConnectionData } from '@/api/admin-system'

defineOptions({ name: 'SystemHealth' })

const loading = ref(false)
const health = ref<HealthData | null>(null)
const connData = ref<ConnectionData | null>(null)
const autoRefresh = ref(true)
let refreshTimer: ReturnType<typeof setInterval> | null = null

const statusColor = computed(() => {
  if (!health.value) return 'info'
  return health.value.status === 'healthy' ? 'success' : health.value.status === 'degraded' ? 'warning' : 'danger'
})

const statusText = computed(() => {
  if (!health.value) return '加载中...'
  return health.value.status === 'healthy' ? '系统健康' : health.value.status === 'degraded' ? '部分降级' : '系统异常'
})

function formatUptime(seconds: number) {
  if (!seconds) return '-'
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const parts = []
  if (d > 0) parts.push(`${d}天`)
  if (h > 0) parts.push(`${h}小时`)
  if (m > 0) parts.push(`${m}分`)
  parts.push(`${s}秒`)
  return parts.join('')
}

function formatBytes(bytes: number) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let val = bytes
  while (val >= 1024 && i < units.length - 1) { val /= 1024; i++ }
  return `${val.toFixed(1)} ${units[i]}`
}

async function loadAll() {
  loading.value = true
  try {
    const [h, c] = await Promise.all([fetchSystemHealth(), fetchConnectionStatus()])
    health.value = h
    connData.value = c
  } catch {} finally {
    loading.value = false
  }
}

function toggleAutoRefresh() {
  autoRefresh.value = !autoRefresh.value
  if (autoRefresh.value) startTimer()
  else stopTimer()
}

function startTimer() {
  stopTimer()
  refreshTimer = setInterval(loadAll, 10000)
}

function stopTimer() {
  if (refreshTimer) { clearInterval(refreshTimer); refreshTimer = null }
}

onMounted(() => {
  loadAll()
  if (autoRefresh.value) startTimer()
})

onUnmounted(() => stopTimer())
</script>
