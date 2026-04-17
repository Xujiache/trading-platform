<template>
  <div class="activities-page art-full-height">
    <ElCard class="mb-4" shadow="never">
      <ElForm :model="searchForm" inline>
        <ElFormItem label="关键词">
          <ElInput v-model="searchForm.keyword" placeholder="标题/摘要" clearable style="width: 160px" />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSelect v-model="searchForm.status" placeholder="全部" clearable style="width: 120px">
            <ElOption label="草稿" value="draft" />
            <ElOption label="进行中" value="active" />
            <ElOption label="已结束" value="ended" />
            <ElOption label="已归档" value="archived" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="类型">
          <ElSelect v-model="searchForm.activity_type" placeholder="全部" clearable style="width: 120px">
            <ElOption label="促销" value="promotion" />
            <ElOption label="竞赛" value="competition" />
            <ElOption label="赠金" value="bonus" />
            <ElOption label="其他" value="other" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem>
          <ElButton type="primary" @click="handleSearch">搜索</ElButton>
          <ElButton @click="handleReset">重置</ElButton>
        </ElFormItem>
      </ElForm>
    </ElCard>

    <ElRow :gutter="16" class="mb-4">
      <ElCol :span="6" v-for="item in statsCards" :key="item.label">
        <ElCard shadow="never" class="stat-card">
          <div class="stat-value">{{ item.value }}</div>
          <div class="stat-label">{{ item.label }}</div>
        </ElCard>
      </ElCol>
    </ElRow>

    <ElCard shadow="never">
      <div class="table-header flex-between mb-4">
        <span class="font-bold">活动列表</span>
        <div>
          <ElButton type="primary" @click="openDialog()">新增活动</ElButton>
          <ElButton :icon="Refresh" circle @click="loadData" />
        </div>
      </div>

      <ElTable :data="tableData" v-loading="loading" border stripe>
        <ElTableColumn prop="id" label="ID" width="60" />
        <ElTableColumn prop="title" label="标题" width="180" show-overflow-tooltip />
        <ElTableColumn prop="activity_type" label="类型" width="80">
          <template #default="{ row }">
            <ElTag size="small">{{ typeMap[row.activity_type] }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="status" label="状态" width="80">
          <template #default="{ row }">
            <ElTag :type="statusTypeMap[row.status]" size="small">{{ statusMap[row.status] }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="时间" width="320">
          <template #default="{ row }">
            {{ row.start_time || '-' }} ~ {{ row.end_time || '-' }}
          </template>
        </ElTableColumn>
        <ElTableColumn prop="view_count" label="浏览" width="70" />
        <ElTableColumn prop="current_participants" label="参与" width="70" />
        <ElTableColumn prop="is_top" label="置顶" width="60">
          <template #default="{ row }">
            <ElTag :type="row.is_top ? 'danger' : 'info'" size="small">{{ row.is_top ? '是' : '否' }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <ElButton type="primary" size="small" link @click="openDialog(row)">编辑</ElButton>
            <ElButton v-if="row.status === 'draft'" type="success" size="small" link @click="handlePublish(row)">上线</ElButton>
            <ElButton v-if="row.status === 'active'" type="warning" size="small" link @click="handleEnd(row)">下线</ElButton>
            <ElPopconfirm title="确认删除？" @confirm="handleDelete(row.id)">
              <template #reference>
                <ElButton type="danger" size="small" link>删除</ElButton>
              </template>
            </ElPopconfirm>
          </template>
        </ElTableColumn>
      </ElTable>

      <div class="flex-end mt-4">
        <ElPagination v-model:current-page="pagination.page" v-model:page-size="pagination.pageSize"
          :total="pagination.total" layout="total, prev, pager, next" @current-change="loadData" />
      </div>
    </ElCard>

    <ElDialog v-model="dialogVisible" :title="editingId ? '编辑活动' : '新增活动'" width="700" top="5vh">
      <ElForm :model="form" label-width="100px">
        <ElFormItem label="标题" required>
          <ElInput v-model="form.title" placeholder="活动标题" />
        </ElFormItem>
        <ElFormItem label="摘要">
          <ElInput v-model="form.summary" type="textarea" :rows="2" placeholder="活动摘要" />
        </ElFormItem>
        <ElFormItem label="封面图">
          <ElInput v-model="form.cover_image" placeholder="封面图片URL" />
        </ElFormItem>
        <ElFormItem label="活动类型">
          <ElSelect v-model="form.activity_type" style="width: 100%">
            <ElOption label="促销" value="promotion" />
            <ElOption label="竞赛" value="competition" />
            <ElOption label="赠金" value="bonus" />
            <ElOption label="其他" value="other" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="活动时间">
          <ElDatePicker v-model="form.timeRange" type="datetimerange" start-placeholder="开始时间"
            end-placeholder="结束时间" value-format="YYYY-MM-DD HH:mm:ss" style="width: 100%" />
        </ElFormItem>
        <ElFormItem label="活动详情">
          <ElInput v-model="form.content" type="textarea" :rows="5" placeholder="活动详情(支持富文本)" />
        </ElFormItem>
        <ElFormItem label="活动规则">
          <ElInput v-model="form.rules" type="textarea" :rows="3" placeholder="活动规则" />
        </ElFormItem>
        <ElFormItem label="奖品描述">
          <ElInput v-model="form.prize_desc" placeholder="奖品描述" />
        </ElFormItem>
        <ElFormItem label="最大参与数">
          <ElInputNumber v-model="form.max_participants" :min="0" />
          <span class="ml-2 text-gray">0 = 不限</span>
        </ElFormItem>
        <ElFormItem label="置顶">
          <ElSwitch v-model="form.is_top" :active-value="1" :inactive-value="0" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="handleSubmit" :loading="submitLoading">确定</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import { fetchActivities, fetchActivityStats, createActivity, updateActivity, deleteActivity } from '@/api/admin-operation'

const typeMap: Record<string, string> = { promotion: '促销', competition: '竞赛', bonus: '赠金', other: '其他' }
const statusMap: Record<string, string> = { draft: '草稿', active: '进行中', ended: '已结束', archived: '已归档' }
const statusTypeMap: Record<string, string> = { draft: 'info', active: 'success', ended: 'warning', archived: '' }

const searchForm = reactive({ keyword: '', status: '', activity_type: '' })
const tableData = ref<any[]>([])
const loading = ref(false)
const pagination = reactive({ page: 1, pageSize: 20, total: 0 })
const stats = ref({ total: 0, active: 0, draft: 0, ended: 0 })

const statsCards = computed(() => [
  { label: '总活动数', value: stats.value.total },
  { label: '进行中', value: stats.value.active },
  { label: '草稿', value: stats.value.draft },
  { label: '已结束', value: stats.value.ended },
])

const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const submitLoading = ref(false)
const form = reactive({
  title: '', summary: '', cover_image: '', activity_type: 'promotion',
  content: '', rules: '', prize_desc: '', max_participants: 0, is_top: 0,
  timeRange: null as string[] | null,
})

async function loadData() {
  loading.value = true
  try {
    const res = await fetchActivities({
      page: pagination.page, pageSize: pagination.pageSize,
      ...(searchForm.keyword ? { keyword: searchForm.keyword } : {}),
      ...(searchForm.status ? { status: searchForm.status } : {}),
      ...(searchForm.activity_type ? { activity_type: searchForm.activity_type } : {}),
    })
    tableData.value = res?.list || []
    pagination.total = res?.pagination?.total || 0
  } finally { loading.value = false }
}

async function loadStats() {
  try {
    const res = await fetchActivityStats()
    if (res) stats.value = res
  } catch (e) { /* ignore */ }
}

function handleSearch() { pagination.page = 1; loadData() }
function handleReset() { searchForm.keyword = ''; searchForm.status = ''; searchForm.activity_type = ''; handleSearch() }

function openDialog(row?: any) {
  editingId.value = row?.id || null
  form.title = row?.title || ''
  form.summary = row?.summary || ''
  form.cover_image = row?.cover_image || ''
  form.activity_type = row?.activity_type || 'promotion'
  form.content = row?.content || ''
  form.rules = row?.rules || ''
  form.prize_desc = row?.prize_desc || ''
  form.max_participants = row?.max_participants || 0
  form.is_top = row?.is_top || 0
  form.timeRange = row?.start_time && row?.end_time ? [row.start_time, row.end_time] : null
  dialogVisible.value = true
}

async function handleSubmit() {
  submitLoading.value = true
  try {
    const data: any = { ...form, start_time: form.timeRange?.[0] || null, end_time: form.timeRange?.[1] || null }
    delete data.timeRange
    if (!editingId.value) data.status = 'draft'
    if (editingId.value) {
      await updateActivity(editingId.value, data)
    } else {
      await createActivity(data)
    }
    dialogVisible.value = false
    loadData()
    loadStats()
  } finally { submitLoading.value = false }
}

async function handlePublish(row: any) {
  await updateActivity(row.id, { status: 'active' })
  loadData(); loadStats()
}

async function handleEnd(row: any) {
  await updateActivity(row.id, { status: 'ended' })
  loadData(); loadStats()
}

async function handleDelete(id: number) {
  await deleteActivity(id)
  loadData(); loadStats()
}

onMounted(() => { loadData(); loadStats() })
</script>

<style scoped>
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.flex-end { display: flex; justify-content: flex-end; }
.text-gray { color: #999; font-size: 12px; }
.stat-card { text-align: center; }
.stat-value { font-size: 28px; font-weight: bold; color: #1890ff; }
.stat-label { font-size: 13px; color: #666; margin-top: 4px; }
</style>
