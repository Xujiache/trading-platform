<template>
  <div class="fund-flows-page art-full-height">
    <ElCard class="mb-4" shadow="never">
      <ElForm :model="searchForm" inline>
        <ElFormItem label="用户ID">
          <ElInput v-model="searchForm.userId" placeholder="用户ID" clearable style="width: 120px" />
        </ElFormItem>
        <ElFormItem label="类型">
          <ElSelect v-model="searchForm.flowType" placeholder="全部" clearable style="width: 140px">
            <ElOption label="入金" value="deposit" />
            <ElOption label="出金" value="withdraw" />
            <ElOption label="出金手续费" value="withdraw_fee" />
            <ElOption label="交易盈亏" value="trade_pnl" />
            <ElOption label="手续费" value="commission" />
            <ElOption label="隔夜费" value="swap" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem>
          <ElButton type="primary" @click="handleSearch">搜索</ElButton>
          <ElButton @click="handleReset">重置</ElButton>
        </ElFormItem>
      </ElForm>
    </ElCard>

    <ElCard shadow="never">
      <div class="flex-between mb-4">
        <span class="font-bold">资金流水</span>
        <ElButton :icon="Refresh" circle @click="loadData" />
      </div>

      <ElTable :data="tableData" v-loading="loading" border stripe>
        <ElTableColumn prop="id" label="ID" width="80" />
        <ElTableColumn label="用户" width="150">
          <template #default="{ row }">
            {{ row.user_nickname || row.user_email || `ID:${row.user_id}` }}
          </template>
        </ElTableColumn>
        <ElTableColumn prop="flow_type" label="类型" width="120">
          <template #default="{ row }">
            <ElTag size="small">{{ typeMap[row.flow_type] || row.flow_type }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="amount" label="金额" width="120">
          <template #default="{ row }">
            <span :class="parseFloat(row.amount) >= 0 ? 'text-success' : 'text-danger'" class="font-bold">
              {{ parseFloat(row.amount) >= 0 ? '+' : '' }}{{ row.amount }}
            </span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="balance_before" label="变前余额" width="120" />
        <ElTableColumn prop="balance_after" label="变后余额" width="120" />
        <ElTableColumn prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <ElTableColumn prop="created_at" label="时间" width="170" />
      </ElTable>

      <div class="flex-end mt-4">
        <ElPagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          layout="total, prev, pager, next"
          @current-change="loadData"
        />
      </div>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import { fetchFundFlows } from '@/api/admin-fund'

const typeMap: Record<string, string> = {
  deposit: '入金', withdraw: '出金', withdraw_fee: '出金手续费',
  trade_pnl: '交易盈亏', commission: '手续费', spread: '点差',
  swap: '隔夜费', adjust: '调整', demo_init: '模拟初始',
  margin_freeze: '保证金冻结', margin_release: '保证金释放'
}

const searchForm = reactive({ userId: '', flowType: '' })
const tableData = ref<any[]>([])
const loading = ref(false)
const pagination = reactive({ page: 1, pageSize: 20, total: 0 })

async function loadData() {
  loading.value = true
  try {
    const res = await fetchFundFlows({
      page: pagination.page, pageSize: pagination.pageSize,
      ...(searchForm.userId ? { userId: Number(searchForm.userId) } : {}),
      ...(searchForm.flowType ? { flowType: searchForm.flowType } : {}),
    })
    if (res) {
      tableData.value = res.list || []
      pagination.total = res.pagination?.total || 0
    }
  } finally { loading.value = false }
}

function handleSearch() { pagination.page = 1; loadData() }
function handleReset() { searchForm.userId = ''; searchForm.flowType = ''; handleSearch() }

onMounted(() => loadData())
</script>

<style scoped>
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.flex-end { display: flex; justify-content: flex-end; }
.text-success { color: #52c41a; }
.text-danger { color: #ff4d4f; }
</style>
