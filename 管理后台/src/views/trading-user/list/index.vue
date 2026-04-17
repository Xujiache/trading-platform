<template>
  <div class="user-list-page art-full-height">
    <ElCard class="mb-4" shadow="never">
      <ElForm :model="searchForm" inline>
        <ElFormItem label="邮箱">
          <ElInput v-model="searchForm.email" placeholder="搜索邮箱" clearable style="width: 180px" />
        </ElFormItem>
        <ElFormItem label="KYC状态">
          <ElSelect v-model="searchForm.kycStatus" placeholder="全部" clearable style="width: 120px">
            <ElOption label="未提交" value="none" />
            <ElOption label="待审核" value="pending" />
            <ElOption label="已通过" value="approved" />
            <ElOption label="已驳回" value="rejected" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="账户状态">
          <ElSelect v-model="searchForm.accountStatus" placeholder="全部" clearable style="width: 120px">
            <ElOption label="正常" value="active" />
            <ElOption label="冻结" value="frozen" />
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
        <span class="font-bold">用户列表</span>
        <ElButton :icon="Refresh" circle @click="loadData" />
      </div>

      <ElTable :data="tableData" v-loading="loading" border stripe>
        <ElTableColumn prop="id" label="ID" width="60" />
        <ElTableColumn prop="email" label="邮箱" width="200" show-overflow-tooltip />
        <ElTableColumn prop="nickname" label="昵称" width="120" />
        <ElTableColumn prop="real_name" label="真实姓名" width="100" />
        <ElTableColumn prop="kyc_status" label="KYC" width="90">
          <template #default="{ row }">
            <ElTag :type="getKycType(row.kyc_status)" size="small">{{ getKycText(row.kyc_status) }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="account_status" label="状态" width="70">
          <template #default="{ row }">
            <ElTag :type="row.account_status === 'active' ? 'success' : 'danger'" size="small">
              {{ row.account_status === 'active' ? '正常' : '冻结' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="account_type" label="账户" width="70">
          <template #default="{ row }">
            <ElTag :type="row.account_type === 'real' ? 'warning' : 'info'" size="small">
              {{ row.account_type === 'real' ? '实盘' : '模拟' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="余额" width="120">
          <template #default="{ row }">${{ parseFloat(row.balance || 0).toFixed(2) }}</template>
        </ElTableColumn>
        <ElTableColumn prop="login_count" label="登录次数" width="90" />
        <ElTableColumn prop="created_at" label="注册时间" width="170" />
        <ElTableColumn label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <ElButton type="primary" link size="small" @click="goDetail(row.id)">详情</ElButton>
            <ElButton v-if="row.kyc_status === 'pending'" type="success" link size="small"
              @click="handleKycReview(row)">审核</ElButton>
            <ElButton :type="row.account_status === 'active' ? 'danger' : 'success'" link size="small"
              @click="handleToggle(row)">
              {{ row.account_status === 'active' ? '冻结' : '解冻' }}
            </ElButton>
            <ElButton type="warning" link size="small" @click="handleResetPwd(row)">重置密码</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>

      <div class="pagination-wrap mt-4 flex-end">
        <ElPagination v-model:current-page="pagination.page" v-model:page-size="pagination.limit"
          :total="pagination.total" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next" background
          @size-change="(s: number) => { pagination.limit = s; pagination.page = 1; loadData() }"
          @current-change="(p: number) => { pagination.page = p; loadData() }" />
      </div>
    </ElCard>

    <ElDialog v-model="kycVisible" title="KYC审核" width="500px">
      <template v-if="kycUser">
        <ElDescriptions :column="1" border class="mb-4">
          <ElDescriptionsItem label="姓名">{{ kycUser.real_name }}</ElDescriptionsItem>
          <ElDescriptionsItem label="证件号">{{ kycUser.id_card }}</ElDescriptionsItem>
        </ElDescriptions>
        <ElFormItem label="驳回原因">
          <ElInput v-model="rejectReason" type="textarea" placeholder="驳回时必填" />
        </ElFormItem>
      </template>
      <template #footer>
        <ElButton @click="kycVisible = false">取消</ElButton>
        <ElButton type="danger" @click="doKycReview('rejected')">驳回</ElButton>
        <ElButton type="success" @click="doKycReview('approved')">通过</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
import { Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { fetchUsers, reviewKyc, toggleUserStatus, resetUserPassword, fetchUserDetail } from '@/api/admin-users'
import type { UserItem } from '@/api/admin-users'

defineOptions({ name: 'TradingUserList' })

const router = useRouter()
const loading = ref(false)
const tableData = ref<UserItem[]>([])
const kycVisible = ref(false)
const kycUser = ref<any>(null)
const rejectReason = ref('')

const searchForm = ref({ email: '', kycStatus: '', accountStatus: '' })
const pagination = reactive({ page: 1, limit: 20, total: 0 })

function getKycText(s: string) {
  const map: Record<string, string> = { none: '未提交', pending: '待审核', approved: '已通过', rejected: '已驳回' }
  return map[s] || s
}

function getKycType(s: string) {
  const map: Record<string, string> = { none: 'info', pending: 'warning', approved: 'success', rejected: 'danger' }
  return (map[s] || 'info') as any
}

async function loadData() {
  loading.value = true
  try {
    const params: any = { page: pagination.page, pageSize: pagination.limit }
    if (searchForm.value.email) params.email = searchForm.value.email
    if (searchForm.value.kycStatus) params.kycStatus = searchForm.value.kycStatus
    if (searchForm.value.accountStatus) params.accountStatus = searchForm.value.accountStatus

    const res = await fetchUsers(params)
    if (res?.list) { tableData.value = res.list; pagination.total = res.pagination?.total || 0 }
  } catch { /* handled */ } finally { loading.value = false }
}

function handleSearch() { pagination.page = 1; loadData() }
function handleReset() {
  searchForm.value = { email: '', kycStatus: '', accountStatus: '' }
  pagination.page = 1; loadData()
}

function goDetail(id: number) { router.push(`/trading-user/detail/${id}`) }

async function handleKycReview(row: UserItem) {
  const detail = await fetchUserDetail(row.id)
  kycUser.value = detail
  rejectReason.value = ''
  kycVisible.value = true
}

async function doKycReview(action: string) {
  if (action === 'rejected' && !rejectReason.value) {
    return ElMessage.warning('请填写驳回原因')
  }
  await reviewKyc(kycUser.value.id, { action, reason: rejectReason.value })
  kycVisible.value = false
  loadData()
}

function handleToggle(row: UserItem) {
  const msg = row.account_status === 'active' ? '冻结' : '解冻'
  ElMessageBox.prompt(`请输入${msg}原因`, `${msg}用户`, { inputPlaceholder: '原因(可选)' })
    .then(async ({ value }) => {
      await toggleUserStatus(row.id, { reason: value })
      loadData()
    }).catch(() => {})
}

function handleResetPwd(row: UserItem) {
  ElMessageBox.confirm(`确定要重置用户 ${row.email} 的密码吗？`, '重置密码', { type: 'warning' })
    .then(async () => {
      const res = await resetUserPassword(row.id)
      ElMessageBox.alert(`新密码: ${res.newPassword}`, '密码已重置', { type: 'success' })
    }).catch(() => {})
}

onMounted(() => loadData())
</script>

<style scoped>
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.flex-end { display: flex; justify-content: flex-end; }
</style>
