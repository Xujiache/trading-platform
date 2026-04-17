<template>
  <div class="withdraws-page art-full-height">
    <ElCard class="mb-4" shadow="never">
      <ElForm :model="searchForm" inline>
        <ElFormItem label="用户ID">
          <ElInput v-model="searchForm.userId" placeholder="用户ID" clearable style="width: 120px" />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSelect v-model="searchForm.status" placeholder="全部" clearable style="width: 140px">
            <ElOption label="待审核" value="pending" />
            <ElOption label="已通过" value="approved" />
            <ElOption label="已完成" value="completed" />
            <ElOption label="已驳回" value="rejected" />
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
        <span class="font-bold">出金列表</span>
        <ElButton :icon="Refresh" circle @click="loadData" />
      </div>

      <ElTable :data="tableData" v-loading="loading" border stripe>
        <ElTableColumn prop="withdraw_no" label="单号" width="200" show-overflow-tooltip />
        <ElTableColumn label="用户" width="150">
          <template #default="{ row }">
            {{ row.user_nickname || row.user_email || `ID:${row.user_id}` }}
          </template>
        </ElTableColumn>
        <ElTableColumn prop="amount" label="金额" width="110">
          <template #default="{ row }">
            <span class="font-bold text-danger">${{ row.amount }}</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="fee" label="手续费" width="90" />
        <ElTableColumn prop="actual_amount" label="实到" width="110" />
        <ElTableColumn prop="withdraw_method" label="方式" width="80">
          <template #default="{ row }">
            <ElTag size="small">{{ methodMap[row.withdraw_method] || row.withdraw_method }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="account_no" label="收款账号" width="160" show-overflow-tooltip />
        <ElTableColumn prop="status" label="状态" width="100">
          <template #default="{ row }">
            <ElTag :type="statusType(row.status)" size="small">{{ statusMap[row.status] || row.status }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="created_at" label="申请时间" width="170" />
        <ElTableColumn label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <template v-if="row.status === 'pending' || row.status === 'reviewing'">
              <ElButton type="primary" size="small" @click="handleApprove(row)">通过</ElButton>
              <ElButton type="danger" size="small" @click="handleReject(row)">驳回</ElButton>
            </template>
            <template v-else-if="row.status === 'approved'">
              <ElButton type="success" size="small" @click="handleComplete(row)">标记打款完成</ElButton>
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
import { fetchWithdraws, approveWithdraw, rejectWithdraw, completeWithdraw } from '@/api/admin-fund'

const methodMap: Record<string, string> = { wechat: '微信', alipay: '支付宝', usdt: 'USDT' }
const statusMap: Record<string, string> = {
  pending: '待审核', reviewing: '审核中', approved: '已通过',
  processing: '处理中', completed: '已完成', rejected: '已驳回', cancelled: '已取消'
}
const statusType = (s: string) => {
  if (s === 'completed') return 'success'
  if (s === 'rejected') return 'danger'
  if (s === 'approved') return ''
  return 'warning'
}

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
    const res = await fetchWithdraws({
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

function showRemarkDialog(title: string, action: (remark: string) => Promise<void>) {
  remarkDialog.title = title
  remarkDialog.remark = ''
  remarkDialog.visible = true
  remarkDialog.onConfirm = async () => {
    remarkDialog.loading = true
    try {
      await action(remarkDialog.remark)
      remarkDialog.visible = false
      loadData()
    } finally { remarkDialog.loading = false }
  }
}

function handleApprove(row: any) {
  showRemarkDialog('审核通过', (remark) => approveWithdraw(row.id, { adminRemark: remark }))
}

function handleReject(row: any) {
  showRemarkDialog('驳回出金', (remark) => rejectWithdraw(row.id, { adminRemark: remark }))
}

function handleComplete(row: any) {
  showRemarkDialog('标记打款完成', (remark) => completeWithdraw(row.id, { adminRemark: remark }))
}

onMounted(() => loadData())
</script>

<style scoped>
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.flex-end { display: flex; justify-content: flex-end; }
.text-danger { color: #ff4d4f; }
.text-gray { color: #999; }
</style>
