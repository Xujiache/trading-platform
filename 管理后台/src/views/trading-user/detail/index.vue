<template>
  <div class="user-detail-page" v-loading="loading">
    <ElPageHeader @back="router.back()" class="mb-4">
      <template #content>用户详情 #{{ userId }}</template>
    </ElPageHeader>

    <template v-if="userData">
      <ElRow :gutter="16">
        <ElCol :span="12">
          <ElCard shadow="never" class="mb-4">
            <template #header><span class="font-bold">基本信息</span></template>
            <ElDescriptions :column="2" border>
              <ElDescriptionsItem label="邮箱">{{ userData.email }}</ElDescriptionsItem>
              <ElDescriptionsItem label="昵称">{{ userData.nickname || '-' }}</ElDescriptionsItem>
              <ElDescriptionsItem label="真实姓名">{{ userData.real_name || '-' }}</ElDescriptionsItem>
              <ElDescriptionsItem label="证件号">{{ userData.id_card || '-' }}</ElDescriptionsItem>
              <ElDescriptionsItem label="KYC状态">
                <ElTag :type="getKycType(userData.kyc_status)" size="small">{{ getKycText(userData.kyc_status) }}</ElTag>
              </ElDescriptionsItem>
              <ElDescriptionsItem label="风险等级">{{ userData.risk_level }}</ElDescriptionsItem>
              <ElDescriptionsItem label="账户状态">
                <ElTag :type="userData.account_status === 'active' ? 'success' : 'danger'" size="small">
                  {{ userData.account_status === 'active' ? '正常' : '冻结' }}
                </ElTag>
              </ElDescriptionsItem>
              <ElDescriptionsItem label="2FA">{{ userData.two_factor_enabled ? '已启用' : '未启用' }}</ElDescriptionsItem>
              <ElDescriptionsItem label="注册时间" :span="2">{{ userData.created_at }}</ElDescriptionsItem>
              <ElDescriptionsItem label="最后登录" :span="2">{{ userData.last_login_at || '-' }}</ElDescriptionsItem>
            </ElDescriptions>
          </ElCard>
        </ElCol>
        <ElCol :span="12">
          <ElCard shadow="never" class="mb-4">
            <template #header><span class="font-bold">资金账户</span></template>
            <ElTable :data="userData.accounts || []" border size="small">
              <ElTableColumn prop="account_type" label="类型" width="80">
                <template #default="{ row }">{{ row.account_type === 'real' ? '实盘' : '模拟' }}</template>
              </ElTableColumn>
              <ElTableColumn prop="balance" label="余额" />
              <ElTableColumn prop="frozen_margin" label="保证金" />
              <ElTableColumn prop="floating_pnl" label="浮动盈亏" />
              <ElTableColumn prop="total_deposit" label="累计入金" />
              <ElTableColumn prop="total_withdraw" label="累计出金" />
            </ElTable>
          </ElCard>
        </ElCol>
      </ElRow>

      <ElCard shadow="never">
        <template #header><span class="font-bold">最近订单</span></template>
        <ElTable :data="userData.recentOrders || []" border size="small">
          <ElTableColumn prop="order_no" label="订单号" width="180" show-overflow-tooltip />
          <ElTableColumn prop="symbol" label="品种" width="100" />
          <ElTableColumn prop="direction" label="方向" width="70">
            <template #default="{ row }">
              <ElTag :type="row.direction === 'buy' ? 'success' : 'danger'" size="small">
                {{ row.direction === 'buy' ? '买入' : '卖出' }}
              </ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn prop="lots" label="手数" width="70" />
          <ElTableColumn prop="open_price" label="开仓价" width="110" />
          <ElTableColumn prop="close_price" label="平仓价" width="110">
            <template #default="{ row }">{{ row.close_price ?? '-' }}</template>
          </ElTableColumn>
          <ElTableColumn label="盈亏" width="100">
            <template #default="{ row }">
              <span :class="parseFloat(row.net_pnl || row.realized_pnl || 0) >= 0 ? 'text-success' : 'text-danger'">
                {{ parseFloat(row.net_pnl || row.realized_pnl || 0).toFixed(2) }}
              </span>
            </template>
          </ElTableColumn>
          <ElTableColumn prop="status" label="状态" width="80">
            <template #default="{ row }">{{ row.status === 'open' ? '持仓中' : '已平仓' }}</template>
          </ElTableColumn>
          <ElTableColumn prop="opened_at" label="开仓时间" width="170" />
        </ElTable>
      </ElCard>
    </template>
  </div>
</template>

<script setup lang="ts">
import { fetchUserDetail } from '@/api/admin-users'

defineOptions({ name: 'TradingUserDetail' })

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const userData = ref<any>(null)
const userId = computed(() => route.params.id)

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
    userData.value = await fetchUserDetail(Number(userId.value))
  } catch { /* handled */ } finally { loading.value = false }
}

onMounted(() => loadData())
</script>

<style scoped>
.text-success { color: #67c23a; }
.text-danger { color: #f56c6c; }
</style>
