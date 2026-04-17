<template>
  <div class="art-full-height">
    <ElCard shadow="never">
      <ElForm :model="searchForm" inline class="mb-4">
        <ElFormItem label="操作模块">
          <ElSelect v-model="searchForm.module" placeholder="全部" clearable style="width: 160px">
            <ElOption v-for="m in modules" :key="m" :label="m" :value="m" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="操作人">
          <ElInput v-model="searchForm.admin_username" placeholder="操作人" clearable style="width: 150px" />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSelect v-model="searchForm.status" placeholder="全部" clearable style="width: 120px">
            <ElOption label="成功" value="success" />
            <ElOption label="失败" value="fail" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="日期">
          <ElDatePicker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 280px"
          />
        </ElFormItem>
        <ElFormItem>
          <ElButton type="primary" @click="handleSearch">搜索</ElButton>
          <ElButton @click="handleReset">重置</ElButton>
        </ElFormItem>
      </ElForm>

      <ElTable :data="tableData" v-loading="loading" border stripe>
        <ElTableColumn prop="id" label="ID" width="80" />
        <ElTableColumn prop="admin_username" label="操作人" width="120" />
        <ElTableColumn prop="module" label="模块" width="120" />
        <ElTableColumn prop="action" label="操作" width="150" />
        <ElTableColumn prop="ip" label="IP地址" width="140" />
        <ElTableColumn prop="status" label="状态" width="80">
          <template #default="{ row }">
            <ElTag :type="row.status === 'success' ? 'success' : 'danger'" size="small">
              {{ row.status === 'success' ? '成功' : '失败' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="created_at" label="时间" width="180" />
        <ElTableColumn label="操作" width="80" fixed="right">
          <template #default="{ row }">
            <ElButton link type="primary" size="small" @click="showDetail(row)">详情</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>

      <div class="flex justify-end mt-4">
        <ElPagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </ElCard>

    <ElDialog v-model="detailVisible" title="日志详情" width="600px">
      <ElDescriptions :column="1" border v-if="detailData">
        <ElDescriptionsItem label="ID">{{ detailData.id }}</ElDescriptionsItem>
        <ElDescriptionsItem label="操作人">{{ detailData.admin_username }}</ElDescriptionsItem>
        <ElDescriptionsItem label="模块">{{ detailData.module }}</ElDescriptionsItem>
        <ElDescriptionsItem label="操作">{{ detailData.action }}</ElDescriptionsItem>
        <ElDescriptionsItem label="IP">{{ detailData.ip }}</ElDescriptionsItem>
        <ElDescriptionsItem label="User-Agent">{{ detailData.user_agent }}</ElDescriptionsItem>
        <ElDescriptionsItem label="状态">
          <ElTag :type="detailData.status === 'success' ? 'success' : 'danger'" size="small">
            {{ detailData.status === 'success' ? '成功' : '失败' }}
          </ElTag>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="操作内容">
          <pre style="white-space: pre-wrap; word-break: break-all; max-height: 200px; overflow-y: auto;">{{ formatContent(detailData.content) }}</pre>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="错误信息" v-if="detailData.error_message">
          {{ detailData.error_message }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="时间">{{ detailData.created_at }}</ElDescriptionsItem>
      </ElDescriptions>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { fetchLogList, fetchLogModules, fetchLogDetail, type LogItem } from '@/api/admin-log'

defineOptions({ name: 'OperationLog' })

const searchForm = ref({
  module: '',
  admin_username: '',
  status: '',
})
const dateRange = ref<string[]>([])
const modules = ref<string[]>([])
const tableData = ref<LogItem[]>([])
const loading = ref(false)
const pagination = ref({ page: 1, pageSize: 20, total: 0 })
const detailVisible = ref(false)
const detailData = ref<LogItem | null>(null)

async function loadModules() {
  try {
    const res = await fetchLogModules()
    modules.value = res || []
  } catch {}
}

async function loadData() {
  loading.value = true
  try {
    const params: Record<string, any> = {
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
    }
    if (searchForm.value.module) params.module = searchForm.value.module
    if (searchForm.value.admin_username) params.admin_username = searchForm.value.admin_username
    if (searchForm.value.status) params.status = searchForm.value.status
    if (dateRange.value?.length === 2) {
      params.start_date = dateRange.value[0]
      params.end_date = dateRange.value[1]
    }
    const res = await fetchLogList(params)
    tableData.value = res?.list || []
    pagination.value.total = res?.pagination?.total || 0
  } catch {} finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.value.page = 1
  loadData()
}

function handleReset() {
  searchForm.value = { module: '', admin_username: '', status: '' }
  dateRange.value = []
  pagination.value.page = 1
  loadData()
}

async function showDetail(row: LogItem) {
  try {
    const res = await fetchLogDetail(row.id)
    detailData.value = res
    detailVisible.value = true
  } catch {}
}

function formatContent(content: string) {
  try {
    return JSON.stringify(JSON.parse(content), null, 2)
  } catch {
    return content
  }
}

onMounted(() => {
  loadModules()
  loadData()
})
</script>
