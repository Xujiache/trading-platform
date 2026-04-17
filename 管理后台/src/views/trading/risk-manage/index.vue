<template>
  <div class="risk-manage-page art-full-height">
    <ElTabs v-model="activeTab" type="border-card">
      <ElTabPane label="风控参数" name="config">
        <ElCard shadow="never" v-loading="configLoading">
          <ElForm :model="configForm" label-width="180px" style="max-width: 500px">
            <ElFormItem label="预警线(%)">
              <ElInputNumber v-model="configForm.warning_line" :min="1" :max="100" style="width: 100%" />
            </ElFormItem>
            <ElFormItem label="强平线(%)">
              <ElInputNumber v-model="configForm.force_close_line" :min="1" :max="100" style="width: 100%" />
            </ElFormItem>
            <ElFormItem label="最大杠杆">
              <ElInputNumber v-model="configForm.max_leverage" :min="1" :max="1000" style="width: 100%" />
            </ElFormItem>
            <ElFormItem label="单品种最大持仓(手)">
              <ElInputNumber v-model="configForm.max_position_per_symbol" :min="1" style="width: 100%" />
            </ElFormItem>
            <ElFormItem>
              <ElButton type="primary" @click="saveConfig">保存配置</ElButton>
            </ElFormItem>
          </ElForm>
        </ElCard>
      </ElTabPane>

      <ElTabPane label="风险预警" name="alerts">
        <ElCard shadow="never">
          <ElForm inline class="mb-4">
            <ElFormItem label="状态">
              <ElSelect v-model="alertFilter.status" placeholder="全部" clearable style="width: 120px" @change="loadAlerts">
                <ElOption label="待处理" value="pending" />
                <ElOption label="已处理" value="processed" />
                <ElOption label="已忽略" value="ignored" />
              </ElSelect>
            </ElFormItem>
            <ElFormItem><ElButton type="primary" @click="loadAlerts">搜索</ElButton></ElFormItem>
          </ElForm>

          <ElTable :data="alertData" v-loading="alertLoading" border stripe>
            <ElTableColumn prop="id" label="ID" width="60" />
            <ElTableColumn prop="user_email" label="用户" width="160" show-overflow-tooltip />
            <ElTableColumn prop="alert_type" label="类型" width="120" />
            <ElTableColumn prop="level" label="级别" width="80">
              <template #default="{ row }">
                <ElTag :type="getLevelType(row.level)" size="small">{{ row.level }}</ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn prop="title" label="标题" show-overflow-tooltip />
            <ElTableColumn prop="margin_ratio" label="保证金比例" width="110" />
            <ElTableColumn prop="status" label="状态" width="80">
              <template #default="{ row }">
                <ElTag :type="row.status === 'pending' ? 'warning' : 'info'" size="small">{{ getAlertStatusText(row.status) }}</ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn prop="created_at" label="时间" width="170" />
            <ElTableColumn label="操作" width="160" fixed="right">
              <template #default="{ row }">
                <template v-if="row.status === 'pending'">
                  <ElButton type="success" link size="small" @click="processAlert(row.id, 'processed')">处理</ElButton>
                  <ElButton type="info" link size="small" @click="processAlert(row.id, 'ignored')">忽略</ElButton>
                </template>
              </template>
            </ElTableColumn>
          </ElTable>

          <div class="mt-4 flex-end">
            <ElPagination v-model:current-page="alertPagination.page" v-model:page-size="alertPagination.limit"
              :total="alertPagination.total" layout="total, prev, pager, next" background
              @current-change="loadAlerts" />
          </div>
        </ElCard>
      </ElTabPane>

      <ElTabPane label="强平记录" name="forceClose">
        <ElCard shadow="never">
          <ElTable :data="fcData" v-loading="fcLoading" border stripe>
            <ElTableColumn prop="id" label="ID" width="60" />
            <ElTableColumn prop="user_email" label="用户" width="160" show-overflow-tooltip />
            <ElTableColumn prop="order_no" label="订单号" width="180" show-overflow-tooltip />
            <ElTableColumn prop="symbol" label="品种" width="100" />
            <ElTableColumn prop="trigger_type" label="触发方式" width="90">
              <template #default="{ row }">
                <ElTag :type="row.trigger_type === 'manual' ? 'warning' : 'danger'" size="small">
                  {{ row.trigger_type === 'manual' ? '手动' : '系统' }}
                </ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn prop="trigger_reason" label="原因" show-overflow-tooltip />
            <ElTableColumn prop="close_price" label="平仓价" width="110" />
            <ElTableColumn prop="realized_pnl" label="盈亏" width="100" />
            <ElTableColumn prop="created_at" label="时间" width="170" />
          </ElTable>
          <div class="mt-4 flex-end">
            <ElPagination v-model:current-page="fcPagination.page" v-model:page-size="fcPagination.limit"
              :total="fcPagination.total" layout="total, prev, pager, next" background
              @current-change="loadForceClose" />
          </div>
        </ElCard>
      </ElTabPane>

      <ElTabPane label="高风险监控" name="monitor">
        <ElCard shadow="never">
          <div class="mb-4">
            <ElButton type="primary" @click="loadMonitor">刷新</ElButton>
            <span class="ml-4 text-gray">预警线: {{ monitorData.warningLine }}%</span>
          </div>
          <ElTable :data="monitorData.accounts" v-loading="monitorLoading" border stripe>
            <ElTableColumn prop="user_id" label="用户ID" width="80" />
            <ElTableColumn prop="email" label="邮箱" width="200" />
            <ElTableColumn prop="balance" label="余额" width="120" />
            <ElTableColumn prop="frozen_margin" label="保证金" width="120" />
            <ElTableColumn prop="floating_pnl" label="浮动盈亏" width="120" />
            <ElTableColumn prop="equity" label="净值" width="120" />
            <ElTableColumn label="保证金比例" width="120">
              <template #default="{ row }">
                <span class="text-danger font-bold">{{ parseFloat(row.margin_ratio).toFixed(2) }}%</span>
              </template>
            </ElTableColumn>
            <ElTableColumn label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <ElButton type="danger" link size="small" @click="handleForceClose(row.user_id)">强平</ElButton>
              </template>
            </ElTableColumn>
          </ElTable>
        </ElCard>
      </ElTabPane>

      <ElTabPane label="AML监控" name="aml">
        <ElCard shadow="never">
          <ElTable :data="amlData" v-loading="amlLoading" border stripe>
            <ElTableColumn prop="order_no" label="订单号" width="180" show-overflow-tooltip />
            <ElTableColumn prop="user_email" label="用户" width="160" />
            <ElTableColumn prop="symbol" label="品种" width="100" />
            <ElTableColumn prop="direction" label="方向" width="70">
              <template #default="{ row }">
                <ElTag :type="row.direction === 'buy' ? 'success' : 'danger'" size="small">
                  {{ row.direction === 'buy' ? '买入' : '卖出' }}
                </ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn prop="trade_amount" label="交易金额" width="130" />
            <ElTableColumn prop="margin" label="保证金" width="110" />
            <ElTableColumn prop="leverage" label="杠杆" width="60" />
            <ElTableColumn prop="created_at" label="时间" width="170" />
          </ElTable>
          <div class="mt-4 flex-end">
            <ElPagination v-model:current-page="amlPagination.page" v-model:page-size="amlPagination.limit"
              :total="amlPagination.total" layout="total, prev, pager, next" background
              @current-change="loadAml" />
          </div>
        </ElCard>
      </ElTabPane>
    </ElTabs>
  </div>
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { fetchRiskConfig, updateRiskConfig, fetchRiskAlerts, processRiskAlert, fetchForceCloseRecords, forceCloseUser, fetchRiskMonitor, fetchAmlRecords } from '@/api/admin-risk'

defineOptions({ name: 'RiskManage' })

const activeTab = ref('config')
const configLoading = ref(false)
const configForm = ref({ warning_line: 50, force_close_line: 20, max_leverage: 200, max_position_per_symbol: 100 })

const alertLoading = ref(false)
const alertData = ref<any[]>([])
const alertFilter = ref({ status: '' })
const alertPagination = reactive({ page: 1, limit: 20, total: 0 })

const fcLoading = ref(false)
const fcData = ref<any[]>([])
const fcPagination = reactive({ page: 1, limit: 20, total: 0 })

const monitorLoading = ref(false)
const monitorData = ref<any>({ warningLine: 50, accounts: [] })

const amlLoading = ref(false)
const amlData = ref<any[]>([])
const amlPagination = reactive({ page: 1, limit: 20, total: 0 })

function getLevelType(l: string) {
  const map: Record<string, string> = { low: 'info', medium: 'warning', high: 'danger', critical: 'danger' }
  return (map[l] || 'info') as any
}

function getAlertStatusText(s: string) {
  const map: Record<string, string> = { pending: '待处理', processed: '已处理', ignored: '已忽略', closed: '已关闭' }
  return map[s] || s
}

async function loadConfig() {
  configLoading.value = true
  try {
    const res = await fetchRiskConfig()
    if (res) {
      configForm.value.warning_line = parseFloat(res.warning_line?.value || '50')
      configForm.value.force_close_line = parseFloat(res.force_close_line?.value || '20')
      configForm.value.max_leverage = parseFloat(res.max_leverage?.value || '200')
      configForm.value.max_position_per_symbol = parseFloat(res.max_position_per_symbol?.value || '100')
    }
  } catch { /* handled */ } finally { configLoading.value = false }
}

async function saveConfig() {
  await updateRiskConfig(configForm.value)
}

async function loadAlerts() {
  alertLoading.value = true
  try {
    const params: any = { page: alertPagination.page, pageSize: alertPagination.limit }
    if (alertFilter.value.status) params.status = alertFilter.value.status
    const res = await fetchRiskAlerts(params)
    if (res?.list) { alertData.value = res.list; alertPagination.total = res.pagination?.total || 0 }
  } catch { /* handled */ } finally { alertLoading.value = false }
}

async function processAlert(id: number, action: string) {
  await processRiskAlert(id, { action })
  loadAlerts()
}

async function loadForceClose() {
  fcLoading.value = true
  try {
    const res = await fetchForceCloseRecords({ page: fcPagination.page, pageSize: fcPagination.limit })
    if (res?.list) { fcData.value = res.list; fcPagination.total = res.pagination?.total || 0 }
  } catch { /* handled */ } finally { fcLoading.value = false }
}

async function loadMonitor() {
  monitorLoading.value = true
  try {
    const res = await fetchRiskMonitor()
    if (res) monitorData.value = res
  } catch { /* handled */ } finally { monitorLoading.value = false }
}

async function loadAml() {
  amlLoading.value = true
  try {
    const res = await fetchAmlRecords({ page: amlPagination.page, pageSize: amlPagination.limit })
    if (res?.list) { amlData.value = res.list; amlPagination.total = res.pagination?.total || 0 }
  } catch { /* handled */ } finally { amlLoading.value = false }
}

function handleForceClose(userId: number) {
  ElMessageBox.confirm('确定要强制平仓该用户所有持仓吗？此操作不可撤销！', '手动强平', {
    type: 'warning', confirmButtonText: '确定强平'
  }).then(async () => {
    await forceCloseUser(userId)
    loadMonitor()
  }).catch(() => {})
}

watch(activeTab, (tab) => {
  if (tab === 'config') loadConfig()
  else if (tab === 'alerts') loadAlerts()
  else if (tab === 'forceClose') loadForceClose()
  else if (tab === 'monitor') loadMonitor()
  else if (tab === 'aml') loadAml()
})

onMounted(() => loadConfig())
</script>

<style scoped>
.flex-end { display: flex; justify-content: flex-end; }
.text-danger { color: #f56c6c; }
.text-gray { color: #909399; }
.ml-4 { margin-left: 16px; }
</style>
