<template>
  <div class="art-full-height">
    <ElCard shadow="never">
      <ElForm :model="searchForm" inline class="mb-4">
        <ElFormItem label="操作模块">
          <ElSelect v-model="searchForm.module" placeholder="全部" clearable style="width: 150px">
            <ElOption v-for="m in moduleList" :key="m" :label="m" :value="m" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="操作类型">
          <ElSelect v-model="searchForm.action" placeholder="全部" clearable style="width: 150px">
            <ElOption v-for="a in actionList" :key="a" :label="a" :value="a" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="操作人">
          <ElInput v-model="searchForm.operator_name" placeholder="操作人" clearable style="width: 140px" />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSelect v-model="searchForm.status" placeholder="全部" clearable style="width: 100px">
            <ElOption label="成功" value="success" />
            <ElOption label="失败" value="fail" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="日期">
          <ElDatePicker v-model="dateRange" type="daterange" range-separator="至"
            start-placeholder="开始" end-placeholder="结束" value-format="YYYY-MM-DD" style="width: 280px" />
        </ElFormItem>
        <ElFormItem>
          <ElButton type="primary" @click="handleSearch">搜索</ElButton>
          <ElButton @click="handleReset">重置</ElButton>
        </ElFormItem>
      </ElForm>

      <ElTable :data="tableData" v-loading="loading" border stripe>
        <ElTableColumn prop="id" label="ID" width="80" />
        <ElTableColumn prop="operator_name" label="操作人" width="110" />
        <ElTableColumn prop="operator_type" label="类型" width="70">
          <template #default="{ row }">
            <ElTag :type="row.operator_type === 'admin' ? '' : 'warning'" size="small">{{ row.operator_type }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="module" label="模块" width="110" />
        <ElTableColumn prop="action" label="操作" width="130" />
        <ElTableColumn prop="target_type" label="目标类型" width="90" />
        <ElTableColumn prop="target_id" label="目标ID" width="80" />
        <ElTableColumn prop="ip" label="IP" width="130" />
        <ElTableColumn prop="status" label="状态" width="70">
          <template #default="{ row }">
            <ElTag :type="row.status === 'success' ? 'success' : 'danger'" size="small">
              {{ row.status === 'success' ? '成功' : '失败' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="duration_ms" label="耗时" width="80">
          <template #default="{ row }">{{ row.duration_ms != null ? row.duration_ms + 'ms' : '-' }}</template>
        </ElTableColumn>
        <ElTableColumn prop="created_at" label="时间" width="170" />
        <ElTableColumn label="操作" width="80" fixed="right">
          <template #default="{ row }">
            <ElButton link type="primary" size="small" @click="showDetail(row)">详情</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>

      <div class="flex justify-end mt-4">
        <ElPagination v-model:current-page="pagination.page" v-model:page-size="pagination.pageSize"
          :total="pagination.total" :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next" @size-change="loadData" @current-change="loadData" />
      </div>
    </ElCard>

    <ElDialog v-model="detailVisible" title="审计日志详情" width="700px">
      <ElDescriptions :column="2" border v-if="detailData">
        <ElDescriptionsItem label="ID">{{ detailData.id }}</ElDescriptionsItem>
        <ElDescriptionsItem label="操作人">{{ detailData.operator_name }} ({{ detailData.operator_type }})</ElDescriptionsItem>
        <ElDescriptionsItem label="模块">{{ detailData.module }}</ElDescriptionsItem>
        <ElDescriptionsItem label="操作">{{ detailData.action }}</ElDescriptionsItem>
        <ElDescriptionsItem label="目标类型">{{ detailData.target_type || '-' }}</ElDescriptionsItem>
        <ElDescriptionsItem label="目标ID">{{ detailData.target_id || '-' }}</ElDescriptionsItem>
        <ElDescriptionsItem label="IP">{{ detailData.ip }}</ElDescriptionsItem>
        <ElDescriptionsItem label="耗时">{{ detailData.duration_ms != null ? detailData.duration_ms + 'ms' : '-' }}</ElDescriptionsItem>
        <ElDescriptionsItem label="状态" :span="2">
          <ElTag :type="detailData.status === 'success' ? 'success' : 'danger'" size="small">
            {{ detailData.status === 'success' ? '成功' : '失败' }}
          </ElTag>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="User-Agent" :span="2">
          <span style="word-break: break-all; font-size: 12px">{{ detailData.user_agent || '-' }}</span>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="操作内容" :span="2">
          <pre style="white-space: pre-wrap; word-break: break-all; max-height: 200px; overflow-y: auto; font-size: 12px">{{ formatJson(detailData.content) }}</pre>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="变更前数据" :span="2" v-if="detailData.before_data">
          <pre style="white-space: pre-wrap; word-break: break-all; max-height: 150px; overflow-y: auto; font-size: 12px">{{ formatJson(detailData.before_data) }}</pre>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="变更后数据" :span="2" v-if="detailData.after_data">
          <pre style="white-space: pre-wrap; word-break: break-all; max-height: 150px; overflow-y: auto; font-size: 12px">{{ formatJson(detailData.after_data) }}</pre>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="错误信息" :span="2" v-if="detailData.error_message">
          <span style="color: var(--el-color-danger)">{{ detailData.error_message }}</span>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="时间">{{ detailData.created_at }}</ElDescriptionsItem>
      </ElDescriptions>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { fetchAuditLogs, fetchAuditLogModules, fetchAuditLogDetail, type AuditLogItem, type AuditLogDetail } from '@/api/admin-system'

defineOptions({ name: 'AuditLog' })

const searchForm = ref({ module: '', action: '', operator_name: '', status: '' })
const dateRange = ref<string[]>([])
const moduleList = ref<string[]>([])
const actionList = ref<string[]>([])
const tableData = ref<AuditLogItem[]>([])
const loading = ref(false)
const pagination = ref({ page: 1, pageSize: 20, total: 0 })
const detailVisible = ref(false)
const detailData = ref<AuditLogDetail | null>(null)

async function loadFilters() {
  try {
    const res = await fetchAuditLogModules()
    moduleList.value = res?.modules || []
    actionList.value = res?.actions || []
  } catch {}
}

async function loadData() {
  loading.value = true
  try {
    const params: Record<string, any> = { page: pagination.value.page, pageSize: pagination.value.pageSize }
    if (searchForm.value.module) params.module = searchForm.value.module
    if (searchForm.value.action) params.action = searchForm.value.action
    if (searchForm.value.operator_name) params.operator_name = searchForm.value.operator_name
    if (searchForm.value.status) params.status = searchForm.value.status
    if (dateRange.value?.length === 2) { params.start_date = dateRange.value[0]; params.end_date = dateRange.value[1] }
    const res = await fetchAuditLogs(params)
    tableData.value = res?.list || []
    pagination.value.total = res?.pagination?.total || 0
  } catch {} finally { loading.value = false }
}

function handleSearch() { pagination.value.page = 1; loadData() }
function handleReset() {
  searchForm.value = { module: '', action: '', operator_name: '', status: '' }
  dateRange.value = []
  pagination.value.page = 1
  loadData()
}

async function showDetail(row: AuditLogItem) {
  try {
    const res = await fetchAuditLogDetail(row.id)
    detailData.value = res
    detailVisible.value = true
  } catch {}
}

function formatJson(str: string) {
  try { return JSON.stringify(JSON.parse(str), null, 2) } catch { return str || '-' }
}

onMounted(() => { loadFilters(); loadData() })
</script>
