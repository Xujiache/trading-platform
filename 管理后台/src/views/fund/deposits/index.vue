<template>
  <div class="deposits-page art-full-height">
    <ElCard class="mb-4" shadow="never">
      <ElForm :model="searchForm" inline>
        <ElFormItem label="用户ID">
          <ElInput v-model="searchForm.userId" placeholder="用户ID" clearable style="width: 120px" />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSelect v-model="searchForm.status" placeholder="全部" clearable style="width: 120px">
            <ElOption label="待审核" value="pending" />
            <ElOption label="已完成" value="completed" />
            <ElOption label="已驳回" value="failed" />
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
        <span class="font-bold">入金列表</span>
        <ElButton :icon="Refresh" circle @click="loadData" />
      </div>

      <ElTable :data="tableData" v-loading="loading" border stripe>
        <ElTableColumn prop="deposit_no" label="单号" width="200" show-overflow-tooltip />
        <ElTableColumn label="用户" width="160">
          <template #default="{ row }">
            {{ row.user_nickname || row.user_email || `ID:${row.user_id}` }}
          </template>
        </ElTableColumn>
        <ElTableColumn prop="amount" label="金额" width="120">
          <template #default="{ row }">
            <span class="font-bold text-success">${{ row.amount }}</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="payment_method" label="支付方式" width="100">
          <template #default="{ row }">
            <ElTag size="small">{{ methodMap[row.payment_method] || row.payment_method }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="status" label="状态" width="100">
          <template #default="{ row }">
            <ElTag :type="statusType(row.status)" size="small">{{ statusMap[row.status] || row.status }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="remark" label="备注" width="150" show-overflow-tooltip />
        <ElTableColumn prop="created_at" label="申请时间" width="170" />
        <ElTableColumn label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <template v-if="row.status === 'pending' || row.status === 'reviewing'">
              <ElButton type="primary" size="small" @click="handleConfirm(row)">确认</ElButton>
              <ElButton type="danger" size="small" @click="handleReject(row)">驳回</ElButton>
            </template>
            <span v-else class="text-gray">已处理</span>
          </template>
        </ElTableColumn>
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

    <ElDialog v-model="remarkDialog.visible" :title="remarkDialog.title" width="400">
      <ElInput v-model="remarkDialog.remark" type="textarea" :rows="3" placeholder="审核备注（选填）" />
      <template #footer>
        <ElButton @click="remarkDialog.visible = false">取消</ElButton>
        <ElButton type="primary" @click="remarkDialog.onConfirm" :loading="remarkDialog.loading">确定</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import { fetchDeposits, confirmDeposit, rejectDeposit } from '@/api/admin-fund'

const methodMap: Record<string, string> = { wechat: '微信', alipay: '支付宝', usdt: 'USDT' }
const statusMap: Record<string, string> = { pending: '待审核', reviewing: '审核中', completed: '已完成', failed: '已驳回', cancelled: '已取消' }
const statusType = (s: string) => s === 'completed' ? 'success' : s === 'failed' ? 'danger' : 'warning'

const searchForm = reactive({ userId: '', status: '' })
const tableData = ref<any[]>([])
const loading = ref(false)
const pagination = reactive({ page: 1, pageSize: 20, total: 0 })

const remarkDialog = reactive({
  visible: false, title: '', remark: '', loading: false,
  onConfirm: () => {}
})

async function loadData() {
  loading.value = true
  try {
    const res = await fetchDeposits({
      page: pagination.page, pageSize: pagination.pageSize,
      ...(searchForm.userId ? { userId: Number(searchForm.userId) } : {}),
      ...(searchForm.status ? { status: searchForm.status } : {}),
    })
    if (res) {
      tableData.value = res.list || []
      pagination.total = res.pagination?.total || 0
    }
  } finally { loading.value = false }
}

function handleSearch() { pagination.page = 1; loadData() }
function handleReset() { searchForm.userId = ''; searchForm.status = ''; handleSearch() }

function handleConfirm(row: any) {
  remarkDialog.title = '确认入金'
  remarkDialog.remark = ''
  remarkDialog.visible = true
  remarkDialog.onConfirm = async () => {
    remarkDialog.loading = true
    try {
      await confirmDeposit(row.id, { adminRemark: remarkDialog.remark })
      remarkDialog.visible = false
      loadData()
    } finally { remarkDialog.loading = false }
  }
}

function handleReject(row: any) {
  remarkDialog.title = '驳回入金'
  remarkDialog.remark = ''
  remarkDialog.visible = true
  remarkDialog.onConfirm = async () => {
    remarkDialog.loading = true
    try {
      await rejectDeposit(row.id, { adminRemark: remarkDialog.remark })
      remarkDialog.visible = false
      loadData()
    } finally { remarkDialog.loading = false }
  }
}

onMounted(() => loadData())
</script>

<style scoped>
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.flex-end { display: flex; justify-content: flex-end; }
.text-success { color: #52c41a; }
.text-gray { color: #999; }
</style>
