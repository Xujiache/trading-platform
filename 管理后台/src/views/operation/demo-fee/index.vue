<template>
  <div class="demo-fee-page art-full-height">
    <ElCard shadow="never" class="mb-4">
      <div class="table-header flex-between mb-4">
        <span class="font-bold">模拟盘费用配置</span>
        <div>
          <ElButton type="warning" @click="handleSyncAll">全部同步真实盘</ElButton>
          <ElButton :icon="Refresh" circle @click="loadData" />
        </div>
      </div>

      <ElAlert title="模拟盘费用可独立配置，与真实盘分开管理。未自定义的品种将使用真实盘费率。" type="info" :closable="false" class="mb-4" />

      <ElTable :data="mergedData" v-loading="loading" border stripe>
        <ElTableColumn prop="symbol" label="品种代码" width="100" />
        <ElTableColumn prop="symbol_name" label="品种名称" width="120" />
        <ElTableColumn prop="category" label="分类" width="100">
          <template #default="{ row }">
            <ElTag size="small">{{ categoryMap[row.category] || row.category }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="手续费" width="140">
          <template #default="{ row }">
            {{ row.fee_value }} ({{ row.fee_type === 'per_lot' ? '每手' : '百分比' }})
          </template>
        </ElTableColumn>
        <ElTableColumn label="点差" width="160">
          <template #default="{ row }">
            <template v-if="row.spread_mode === 'fixed'">固定 {{ row.spread_fixed }}</template>
            <template v-else>浮动 {{ row.spread_min }}-{{ row.spread_max }}</template>
          </template>
        </ElTableColumn>
        <ElTableColumn label="隔夜费" width="160">
          <template #default="{ row }">多:{{ row.swap_long_rate }} / 空:{{ row.swap_short_rate }}</template>
        </ElTableColumn>
        <ElTableColumn prop="is_custom" label="配置来源" width="100">
          <template #default="{ row }">
            <ElTag :type="row.is_custom ? 'warning' : 'info'" size="small">{{ row.is_custom ? '自定义' : '同步真实盘' }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <ElButton type="primary" size="small" link @click="openDialog(row)">配置</ElButton>
            <ElButton v-if="row.is_custom" type="warning" size="small" link @click="handleReset(row.symbol)">恢复默认</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
    </ElCard>

    <ElDialog v-model="dialogVisible" title="模拟盘费用配置" width="500">
      <ElForm :model="form" label-width="100px">
        <ElFormItem label="品种">
          <ElInput :model-value="`${form.symbol} (${form.symbol_name})`" disabled />
        </ElFormItem>
        <ElFormItem label="手续费类型">
          <ElSelect v-model="form.fee_type" style="width: 100%">
            <ElOption label="每手固定" value="per_lot" />
            <ElOption label="百分比" value="percentage" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="手续费费率">
          <ElInputNumber v-model="form.fee_value" :min="0" :precision="4" style="width: 100%" />
        </ElFormItem>
        <ElFormItem label="点差模式">
          <ElSelect v-model="form.spread_mode" style="width: 100%">
            <ElOption label="固定点差" value="fixed" />
            <ElOption label="浮动点差" value="float" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="固定点差" v-if="form.spread_mode === 'fixed'">
          <ElInputNumber v-model="form.spread_fixed" :min="0" :precision="4" style="width: 100%" />
        </ElFormItem>
        <template v-if="form.spread_mode === 'float'">
          <ElFormItem label="最小点差">
            <ElInputNumber v-model="form.spread_min" :min="0" :precision="4" style="width: 100%" />
          </ElFormItem>
          <ElFormItem label="最大点差">
            <ElInputNumber v-model="form.spread_max" :min="0" :precision="4" style="width: 100%" />
          </ElFormItem>
        </template>
        <ElFormItem label="多单隔夜费">
          <ElInputNumber v-model="form.swap_long_rate" :precision="6" style="width: 100%" />
        </ElFormItem>
        <ElFormItem label="空单隔夜费">
          <ElInputNumber v-model="form.swap_short_rate" :precision="6" style="width: 100%" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="handleSubmit" :loading="submitLoading">保存</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessageBox } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { fetchDemoFeeConfigs, saveDemoFeeConfig, resetDemoFee, syncAllDemoFee } from '@/api/admin-operation'

const categoryMap: Record<string, string> = { precious_metal: '贵金属', energy: '能源', forex: '外汇' }

const mergedData = ref<any[]>([])
const loading = ref(false)

const dialogVisible = ref(false)
const submitLoading = ref(false)
const form = reactive({
  symbol_id: 0, symbol: '', symbol_name: '',
  fee_type: 'per_lot', fee_value: 0,
  spread_mode: 'fixed', spread_fixed: 0, spread_min: 0, spread_max: 0,
  swap_long_rate: 0, swap_short_rate: 0,
})

async function loadData() {
  loading.value = true
  try {
    const res = await fetchDemoFeeConfigs()
    mergedData.value = res || []
  } finally { loading.value = false }
}

function openDialog(row: any) {
  form.symbol_id = row.symbol_id || row.id
  form.symbol = row.symbol
  form.symbol_name = row.symbol_name || row.name
  form.fee_type = row.fee_type || 'per_lot'
  form.fee_value = row.fee_value || 0
  form.spread_mode = row.spread_mode || 'fixed'
  form.spread_fixed = row.spread_fixed || 0
  form.spread_min = row.spread_min || 0
  form.spread_max = row.spread_max || 0
  form.swap_long_rate = row.swap_long_rate || 0
  form.swap_short_rate = row.swap_short_rate || 0
  dialogVisible.value = true
}

async function handleSubmit() {
  submitLoading.value = true
  try {
    await saveDemoFeeConfig({ ...form, is_custom: 1 })
    dialogVisible.value = false
    loadData()
  } finally { submitLoading.value = false }
}

async function handleReset(symbol: string) {
  await ElMessageBox.confirm('确定恢复为真实盘费率？', '提示', { type: 'warning' })
  await resetDemoFee(symbol)
  loadData()
}

async function handleSyncAll() {
  await ElMessageBox.confirm('将所有模拟盘费率同步为当前真实盘设置，已自定义的配置将被覆盖。确认？', '全部同步', { type: 'warning' })
  await syncAllDemoFee()
  loadData()
}

onMounted(() => loadData())
</script>

<style scoped>
.flex-between { display: flex; justify-content: space-between; align-items: center; }
</style>
