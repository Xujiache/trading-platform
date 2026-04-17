<template>
  <div class="art-full-height">
    <ElCard shadow="never">
      <template #header>
        <div class="flex items-center justify-between">
          <span class="text-lg font-medium">数据导出</span>
          <ElButton type="primary" size="small" @click="loadExportTypes" :loading="loadingTypes">刷新</ElButton>
        </div>
      </template>

      <ElAlert title="数据导出说明" type="info" :closable="false" class="mb-4">
        <template #default>
          <p>支持导出用户列表、订单列表、资金流水、入金记录、出金记录、交易流水为 CSV 文件。</p>
          <p>单次导出最多 50,000 条记录，可通过筛选条件缩小范围。导出文件编码为 UTF-8 with BOM，Excel 可直接打开。</p>
        </template>
      </ElAlert>

      <ElRow :gutter="16">
        <ElCol :span="8" v-for="item in exportTypes" :key="item.type">
          <ElCard shadow="hover" class="mb-4" :body-style="{ padding: '20px' }">
            <div class="flex items-center mb-3">
              <span class="text-base font-medium">{{ typeLabels[item.type] || item.type }}</span>
              <ElTag size="small" class="ml-2">{{ item.fieldCount }}个字段</ElTag>
            </div>

            <ElForm :model="exportParams[item.type]" label-width="70px" size="small">
              <ElFormItem label="开始日期">
                <ElDatePicker v-model="exportParams[item.type].start_date" type="date" placeholder="选择"
                  value-format="YYYY-MM-DD" style="width: 100%" />
              </ElFormItem>
              <ElFormItem label="结束日期">
                <ElDatePicker v-model="exportParams[item.type].end_date" type="date" placeholder="选择"
                  value-format="YYYY-MM-DD" style="width: 100%" />
              </ElFormItem>
              <ElFormItem label="状态" v-if="item.type !== 'trade_flows'">
                <ElInput v-model="exportParams[item.type].status" placeholder="可选" />
              </ElFormItem>
            </ElForm>

            <ElButton type="primary" style="width: 100%" @click="handleExport(item.type)"
              :loading="exporting[item.type]">
              导出 {{ typeLabels[item.type] || item.type }}
            </ElButton>
          </ElCard>
        </ElCol>
      </ElRow>

      <ElEmpty v-if="!exportTypes.length && !loadingTypes" description="暂无可用导出类型" />
    </ElCard>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchExportTypes, exportCsv, type ExportType } from '@/api/admin-system'

defineOptions({ name: 'DataExport' })

const typeLabels: Record<string, string> = {
  users: '用户列表', orders: '订单列表', fund_flows: '资金流水',
  deposits: '入金记录', withdraws: '出金记录', trade_flows: '交易流水',
}

const exportTypes = ref<ExportType[]>([])
const loadingTypes = ref(false)
const exporting = reactive<Record<string, boolean>>({})
const exportParams = reactive<Record<string, { start_date: string; end_date: string; status: string }>>({})

async function loadExportTypes() {
  loadingTypes.value = true
  try {
    const res = await fetchExportTypes()
    exportTypes.value = res || []
    for (const t of exportTypes.value) {
      if (!exportParams[t.type]) {
        exportParams[t.type] = { start_date: '', end_date: '', status: '' }
      }
    }
  } catch {} finally { loadingTypes.value = false }
}

async function handleExport(type: string) {
  exporting[type] = true
  try {
    const params: Record<string, any> = {}
    const p = exportParams[type]
    if (p?.start_date) params.start_date = p.start_date
    if (p?.end_date) params.end_date = p.end_date
    if (p?.status) params.status = p.status

    const response = await exportCsv(type, params) as any

    const blob = response instanceof Blob ? response : new Blob([response], { type: 'text/csv;charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    link.href = url
    link.download = `${type}_${timestamp}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (e: any) {
    ElMessage.error('导出失败: ' + (e?.message || '未知错误'))
  } finally { exporting[type] = false }
}

onMounted(() => loadExportTypes())
</script>
