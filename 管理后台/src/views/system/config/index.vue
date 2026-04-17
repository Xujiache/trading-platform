<template>
  <div class="art-full-height">
    <ElCard shadow="never">
      <ElForm inline class="mb-4">
        <ElFormItem label="分类">
          <ElSelect v-model="selectedCategory" placeholder="全部分类" clearable style="width: 150px" @change="loadData">
            <ElOption v-for="c in categories" :key="c" :label="categoryLabels[c] || c" :value="c" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="搜索">
          <ElInput v-model="keyword" placeholder="配置名或标签" clearable style="width: 200px" @keyup.enter="loadData" />
        </ElFormItem>
        <ElFormItem>
          <ElButton type="primary" @click="loadData">搜索</ElButton>
        </ElFormItem>
      </ElForm>

      <ElTable :data="configList" v-loading="loading" border stripe>
        <ElTableColumn prop="config_key" label="配置键" width="220" />
        <ElTableColumn prop="label" label="名称" width="160" />
        <ElTableColumn prop="category" label="分类" width="100">
          <template #default="{ row }">
            <ElTag size="small">{{ categoryLabels[row.category] || row.category }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="config_type" label="类型" width="80" />
        <ElTableColumn label="值" min-width="200">
          <template #default="{ row }">
            <template v-if="editingId === row.id">
              <ElInput v-if="row.config_type === 'string' || row.config_type === 'number'" v-model="editValue" size="small" style="width: 200px" />
              <ElInput v-else-if="row.config_type === 'text'" v-model="editValue" type="textarea" :rows="3" size="small" />
              <ElSwitch v-else-if="row.config_type === 'boolean'" v-model="editBoolValue" />
              <div v-else-if="row.config_type === 'image'">
                <ElImage v-if="editValue" :src="editValue" style="width: 80px; height: 80px" fit="contain" />
                <ElUpload
                  action="/api/admin/upload/image"
                  :show-file-list="false"
                  :on-success="handleUploadSuccess"
                  :headers="uploadHeaders"
                >
                  <ElButton size="small" type="primary">上传图片</ElButton>
                </ElUpload>
              </div>
              <div class="mt-2">
                <ElButton type="primary" size="small" @click="saveConfig(row)">保存</ElButton>
                <ElButton size="small" @click="editingId = 0">取消</ElButton>
              </div>
            </template>
            <template v-else>
              <template v-if="row.config_type === 'image' && row.config_value">
                <ElImage :src="row.config_value" style="width: 60px; height: 60px" fit="contain" />
              </template>
              <template v-else-if="row.config_type === 'boolean'">
                <ElTag :type="row.config_value === 'true' ? 'success' : 'info'" size="small">
                  {{ row.config_value === 'true' ? '是' : '否' }}
                </ElTag>
              </template>
              <template v-else>
                <span>{{ row.config_value || '-' }}</span>
              </template>
            </template>
          </template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="80" fixed="right">
          <template #default="{ row }">
            <ElButton link type="primary" size="small" @click="startEdit(row)">编辑</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { fetchConfigList, fetchConfigCategories, updateConfig, type ConfigItem } from '@/api/admin-config'
import { useUserStore } from '@/store/modules/user'
import { ElMessage } from 'element-plus'

defineOptions({ name: 'SystemConfig' })

const categoryLabels: Record<string, string> = {
  system: '系统',
  trade: '交易',
  fund: '资金',
  risk: '风控',
  email: '邮箱',
  security: '安全',
}

const categories = ref<string[]>([])
const selectedCategory = ref('')
const keyword = ref('')
const configList = ref<ConfigItem[]>([])
const loading = ref(false)
const editingId = ref(0)
const editValue = ref('')
const editBoolValue = ref(false)
const uploadHeaders = computed(() => {
  const { accessToken } = useUserStore()
  return { Authorization: accessToken }
})

async function loadCategories() {
  try {
    const res = await fetchConfigCategories()
    categories.value = res || []
  } catch {}
}

async function loadData() {
  loading.value = true
  try {
    const params: Record<string, string> = {}
    if (selectedCategory.value) params.category = selectedCategory.value
    if (keyword.value) params.keyword = keyword.value
    const res = await fetchConfigList(params)
    configList.value = res || []
  } catch {} finally {
    loading.value = false
  }
}

function startEdit(row: ConfigItem) {
  editingId.value = row.id
  editValue.value = row.config_value
  editBoolValue.value = row.config_value === 'true'
}

async function saveConfig(row: ConfigItem) {
  try {
    let val = editValue.value
    if (row.config_type === 'boolean') {
      val = editBoolValue.value ? 'true' : 'false'
    }
    await updateConfig(row.id, { config_value: val })
    ElMessage.success('配置更新成功')
    editingId.value = 0
    loadData()
  } catch {}
}

function handleUploadSuccess(response: any) {
  if (response?.data?.url) {
    editValue.value = response.data.url
  }
}

onMounted(() => {
  loadCategories()
  loadData()
})
</script>
