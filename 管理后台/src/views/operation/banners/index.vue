<template>
  <div class="banners-page art-full-height">
    <ElCard class="mb-4" shadow="never">
      <ElForm :model="searchForm" inline>
        <ElFormItem label="状态">
          <ElSelect v-model="searchForm.status" placeholder="全部" clearable style="width: 120px">
            <ElOption label="启用" value="active" />
            <ElOption label="禁用" value="inactive" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="位置">
          <ElSelect v-model="searchForm.position" placeholder="全部" clearable style="width: 120px">
            <ElOption label="顶部" value="top" />
            <ElOption label="中部" value="middle" />
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
        <span class="font-bold">Banner列表</span>
        <div>
          <ElButton type="primary" @click="openDialog()">新增Banner</ElButton>
          <ElButton :icon="Refresh" circle @click="loadData" />
        </div>
      </div>

      <ElTable :data="tableData" v-loading="loading" border stripe>
        <ElTableColumn prop="id" label="ID" width="60" />
        <ElTableColumn prop="title" label="标题" width="150" show-overflow-tooltip />
        <ElTableColumn label="图片" width="120">
          <template #default="{ row }">
            <ElImage :src="row.image_url" style="width: 80px; height: 40px" fit="cover" :preview-src-list="[row.image_url]" />
          </template>
        </ElTableColumn>
        <ElTableColumn prop="link_type" label="跳转类型" width="100">
          <template #default="{ row }">
            <ElTag size="small">{{ linkTypeMap[row.link_type] || row.link_type }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="position" label="位置" width="80">
          <template #default="{ row }">{{ row.position === 'top' ? '顶部' : '中部' }}</template>
        </ElTableColumn>
        <ElTableColumn prop="sort_order" label="排序" width="70" />
        <ElTableColumn prop="click_count" label="点击数" width="80" />
        <ElTableColumn prop="status" label="状态" width="80">
          <template #default="{ row }">
            <ElTag :type="row.status === 'active' ? 'success' : 'info'" size="small">{{ row.status === 'active' ? '启用' : '禁用' }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="created_at" label="创建时间" width="170" />
        <ElTableColumn label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <ElButton type="primary" size="small" link @click="openDialog(row)">编辑</ElButton>
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

    <ElDialog v-model="dialogVisible" :title="editingId ? '编辑Banner' : '新增Banner'" width="600">
      <ElForm :model="form" label-width="100px">
        <ElFormItem label="标题" required>
          <ElInput v-model="form.title" placeholder="Banner标题" />
        </ElFormItem>
        <ElFormItem label="图片" required>
          <div class="upload-area">
            <ElUpload :action="uploadUrl" :headers="uploadHeaders" :show-file-list="false"
              :on-success="onImageUpload" accept="image/*">
              <ElButton type="primary" size="small">上传图片</ElButton>
            </ElUpload>
            <ElInput v-model="form.image_url" placeholder="或直接输入图片URL" class="mt-2" />
            <ElImage v-if="form.image_url" :src="form.image_url" style="max-width: 200px; max-height: 100px; margin-top: 8px" fit="contain" />
          </div>
        </ElFormItem>
        <ElFormItem label="跳转类型">
          <ElSelect v-model="form.link_type" style="width: 100%">
            <ElOption label="无跳转" value="none" />
            <ElOption label="外部链接" value="url" />
            <ElOption label="页面" value="page" />
            <ElOption label="活动" value="activity" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="跳转地址" v-if="form.link_type !== 'none'">
          <ElInput v-model="form.link_value" placeholder="URL/页面路径/活动ID" />
        </ElFormItem>
        <ElFormItem label="展示位置">
          <ElRadioGroup v-model="form.position">
            <ElRadio value="top">顶部</ElRadio>
            <ElRadio value="middle">中部</ElRadio>
          </ElRadioGroup>
        </ElFormItem>
        <ElFormItem label="排序">
          <ElInputNumber v-model="form.sort_order" :min="0" />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSwitch v-model="form.status" active-value="active" inactive-value="inactive" />
        </ElFormItem>
        <ElFormItem label="展示时间">
          <ElDatePicker v-model="form.timeRange" type="datetimerange" start-placeholder="开始时间"
            end-placeholder="结束时间" value-format="YYYY-MM-DD HH:mm:ss" style="width: 100%" />
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
import { fetchBanners, createBanner, updateBanner, deleteBanner } from '@/api/admin-operation'
import { useUserStore } from '@/store/modules/user'

const linkTypeMap: Record<string, string> = { none: '无跳转', url: '外部链接', page: '页面', activity: '活动' }

const uploadUrl = '/api/admin/upload/image'
const uploadHeaders = computed(() => {
  const { accessToken } = useUserStore()
  return { Authorization: accessToken }
})

const searchForm = reactive({ status: '', position: '' })
const tableData = ref<any[]>([])
const loading = ref(false)
const pagination = reactive({ page: 1, pageSize: 20, total: 0 })

const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const submitLoading = ref(false)
const form = reactive({
  title: '', image_url: '', link_type: 'none', link_value: '',
  position: 'top', sort_order: 0, status: 'active' as string,
  timeRange: null as string[] | null,
})

async function loadData() {
  loading.value = true
  try {
    const res = await fetchBanners({
      page: pagination.page, pageSize: pagination.pageSize,
      ...(searchForm.status ? { status: searchForm.status } : {}),
      ...(searchForm.position ? { position: searchForm.position } : {}),
    })
    tableData.value = res?.list || []
    pagination.total = res?.pagination?.total || 0
  } finally { loading.value = false }
}

function handleSearch() { pagination.page = 1; loadData() }
function handleReset() { searchForm.status = ''; searchForm.position = ''; handleSearch() }

function onImageUpload(response: any) {
  if (response?.code === 200 && response?.data?.url) {
    form.image_url = response.data.url
  }
}

function openDialog(row?: any) {
  editingId.value = row?.id || null
  form.title = row?.title || ''
  form.image_url = row?.image_url || ''
  form.link_type = row?.link_type || 'none'
  form.link_value = row?.link_value || ''
  form.position = row?.position || 'top'
  form.sort_order = row?.sort_order || 0
  form.status = row?.status || 'active'
  form.timeRange = row?.start_time && row?.end_time ? [row.start_time, row.end_time] : null
  dialogVisible.value = true
}

async function handleSubmit() {
  submitLoading.value = true
  try {
    const data: any = { ...form, start_time: form.timeRange?.[0] || null, end_time: form.timeRange?.[1] || null }
    delete data.timeRange
    if (editingId.value) {
      await updateBanner(editingId.value, data)
    } else {
      await createBanner(data)
    }
    dialogVisible.value = false
    loadData()
  } finally { submitLoading.value = false }
}

async function handleDelete(id: number) {
  await deleteBanner(id)
  loadData()
}

onMounted(() => loadData())
</script>

<style scoped>
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.flex-end { display: flex; justify-content: flex-end; }
.upload-area { width: 100%; }
</style>
