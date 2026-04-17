<template>
  <div class="integrations-page art-full-height">
    <ElCard class="mb-4" shadow="never">
      <ElForm :model="searchForm" inline>
        <ElFormItem label="类型">
          <ElSelect v-model="searchForm.type" placeholder="全部" clearable style="width: 140px">
            <ElOption label="行情数据" value="market_data" />
            <ElOption label="支付" value="payment" />
            <ElOption label="邮件" value="email" />
            <ElOption label="推送" value="push" />
            <ElOption label="短信" value="sms" />
            <ElOption label="其他" value="other" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSelect v-model="searchForm.status" placeholder="全部" clearable style="width: 120px">
            <ElOption label="启用" value="active" />
            <ElOption label="禁用" value="inactive" />
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
        <span class="font-bold">第三方接口配置</span>
        <div>
          <ElButton type="primary" @click="openDialog()">新增接口</ElButton>
          <ElButton :icon="Refresh" circle @click="loadData" />
        </div>
      </div>

      <ElTable :data="tableData" v-loading="loading" border stripe>
        <ElTableColumn prop="id" label="ID" width="60" />
        <ElTableColumn prop="name" label="接口名称" width="150" show-overflow-tooltip />
        <ElTableColumn prop="type" label="类型" width="100">
          <template #default="{ row }">
            <ElTag size="small">{{ typeMap[row.type] || row.type }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="provider" label="服务商" width="120" show-overflow-tooltip />
        <ElTableColumn prop="api_url" label="接口地址" width="200" show-overflow-tooltip />
        <ElTableColumn prop="status" label="状态" width="80">
          <template #default="{ row }">
            <ElTag :type="row.status === 'active' ? 'success' : 'info'" size="small">{{ row.status === 'active' ? '启用' : '禁用' }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="连通性" width="120">
          <template #default="{ row }">
            <ElTag :type="checkStatusType(row.last_check_status)" size="small">
              {{ checkStatusMap[row.last_check_status] || '未检测' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="last_check_at" label="最后检测" width="170" />
        <ElTableColumn label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <ElButton type="primary" size="small" link @click="openEditDialog(row.id)">编辑</ElButton>
            <ElButton type="success" size="small" link @click="handleCheck(row)" :loading="row._checking">检测</ElButton>
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

    <ElDialog v-model="dialogVisible" :title="editingId ? '编辑接口' : '新增接口'" width="650">
      <ElForm :model="form" label-width="100px">
        <ElFormItem label="名称" required>
          <ElInput v-model="form.name" placeholder="接口名称" />
        </ElFormItem>
        <ElFormItem label="类型" required>
          <ElSelect v-model="form.type" style="width: 100%">
            <ElOption label="行情数据" value="market_data" />
            <ElOption label="支付" value="payment" />
            <ElOption label="邮件" value="email" />
            <ElOption label="推送" value="push" />
            <ElOption label="短信" value="sms" />
            <ElOption label="其他" value="other" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="服务商">
          <ElInput v-model="form.provider" placeholder="服务商名称" />
        </ElFormItem>
        <ElFormItem label="接口地址">
          <ElInput v-model="form.api_url" placeholder="https://..." />
        </ElFormItem>
        <ElFormItem label="API Key">
          <ElInput v-model="form.api_key" :placeholder="editingId ? '留空则不修改' : 'API Key'" show-password />
        </ElFormItem>
        <ElFormItem label="API Secret">
          <ElInput v-model="form.api_secret" :placeholder="editingId ? '留空则不修改' : 'API Secret'" show-password />
        </ElFormItem>
        <ElFormItem label="描述">
          <ElInput v-model="form.description" type="textarea" :rows="2" placeholder="接口描述" />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSwitch v-model="form.status" active-value="active" inactive-value="inactive" />
        </ElFormItem>

        <ElDivider>额外配置</ElDivider>
        <div v-for="(item, idx) in extraConfigList" :key="idx" class="extra-config-row">
          <ElInput v-model="item.key" placeholder="配置项名称" style="width: 180px" />
          <ElInput v-model="item.value" placeholder="配置值" style="width: 240px; margin-left: 8px" />
          <ElButton type="danger" link @click="removeExtraConfig(idx)" style="margin-left: 8px">删除</ElButton>
        </div>
        <ElButton type="primary" link @click="addExtraConfig" class="mt-2">+ 添加配置项</ElButton>
      </ElForm>
      <template #footer>
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="handleSubmit" :loading="submitLoading">确定</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { fetchIntegrations, fetchIntegrationDetail, createIntegration, updateIntegration, deleteIntegration, checkIntegration } from '@/api/admin-operation'

const typeMap: Record<string, string> = { market_data: '行情数据', payment: '支付', email: '邮件', push: '推送', sms: '短信', other: '其他' }
const checkStatusMap: Record<string, string> = { success: '正常', fail: '异常', unknown: '未检测' }
const checkStatusType = (s: string) => s === 'success' ? 'success' : s === 'fail' ? 'danger' : 'info'

const searchForm = reactive({ type: '', status: '' })
const tableData = ref<any[]>([])
const loading = ref(false)
const pagination = reactive({ page: 1, pageSize: 20, total: 0 })

const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const submitLoading = ref(false)
const form = reactive({
  name: '', type: 'market_data', provider: '', api_url: '',
  api_key: '', api_secret: '', description: '', status: 'active' as string,
})
const extraConfigList = ref<{ key: string; value: string }[]>([])

async function loadData() {
  loading.value = true
  try {
    const res = await fetchIntegrations({
      page: pagination.page, pageSize: pagination.pageSize,
      ...(searchForm.type ? { type: searchForm.type } : {}),
      ...(searchForm.status ? { status: searchForm.status } : {}),
    })
    tableData.value = (res?.list || []).map((r: any) => ({ ...r, _checking: false }))
    pagination.total = res?.pagination?.total || 0
  } finally { loading.value = false }
}

function handleSearch() { pagination.page = 1; loadData() }
function handleReset() { searchForm.type = ''; searchForm.status = ''; handleSearch() }

function openDialog() {
  editingId.value = null
  form.name = ''; form.type = 'market_data'; form.provider = ''; form.api_url = ''
  form.api_key = ''; form.api_secret = ''; form.description = ''; form.status = 'active'
  extraConfigList.value = []
  dialogVisible.value = true
}

/** 编辑时先拉取详情（含密钥），避免覆盖 */
async function openEditDialog(id: number) {
  try {
    const detail = await fetchIntegrationDetail(id)
    if (!detail) return
    editingId.value = detail.id
    form.name = detail.name || ''
    form.type = detail.type || 'market_data'
    form.provider = detail.provider || ''
    form.api_url = detail.api_url || ''
    form.api_key = detail.api_key || ''
    form.api_secret = detail.api_secret || ''
    form.description = detail.description || ''
    form.status = detail.status || 'active'
    const ec = detail.extra_config
    if (ec && typeof ec === 'object') {
      extraConfigList.value = Object.entries(ec).map(([key, value]) => ({ key, value: String(value) }))
    } else {
      extraConfigList.value = []
    }
    dialogVisible.value = true
  } catch (e) {
    ElMessage.error('获取详情失败')
  }
}

function addExtraConfig() {
  extraConfigList.value.push({ key: '', value: '' })
}

function removeExtraConfig(idx: number) {
  extraConfigList.value.splice(idx, 1)
}

async function handleSubmit() {
  submitLoading.value = true
  try {
    const extra_config: Record<string, string> = {}
    extraConfigList.value.forEach(item => {
      if (item.key.trim()) extra_config[item.key.trim()] = item.value
    })

    const submitData: Record<string, any> = {
      name: form.name, type: form.type, provider: form.provider,
      api_url: form.api_url, description: form.description, status: form.status,
      extra_config: Object.keys(extra_config).length > 0 ? extra_config : null,
    }

    if (editingId.value) {
      if (form.api_key) submitData.api_key = form.api_key
      if (form.api_secret) submitData.api_secret = form.api_secret
      await updateIntegration(editingId.value, submitData)
    } else {
      submitData.api_key = form.api_key
      submitData.api_secret = form.api_secret
      await createIntegration(submitData)
    }
    dialogVisible.value = false
    loadData()
  } finally { submitLoading.value = false }
}

async function handleCheck(row: any) {
  row._checking = true
  try {
    const res = await checkIntegration(row.id)
    if (res) {
      ElMessage[res.status === 'success' ? 'success' : 'error'](res.message || '检测完成')
    }
    loadData()
  } finally { row._checking = false }
}

async function handleDelete(id: number) {
  await deleteIntegration(id)
  loadData()
}

onMounted(() => loadData())
</script>

<style scoped>
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.flex-end { display: flex; justify-content: flex-end; }
.extra-config-row { display: flex; align-items: center; margin-bottom: 8px; }
</style>
