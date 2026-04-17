<template>
  <div class="kyc-review-page art-full-height">
    <ElCard shadow="never">
      <div class="table-header flex-between mb-4">
        <span class="font-bold">待审核KYC列表</span>
        <ElButton :icon="Refresh" circle @click="loadData" />
      </div>

      <ElTable :data="tableData" v-loading="loading" border stripe>
        <ElTableColumn prop="id" label="用户ID" width="80" />
        <ElTableColumn prop="email" label="邮箱" width="200" />
        <ElTableColumn prop="real_name" label="真实姓名" width="120" />
        <ElTableColumn prop="kyc_status" label="状态" width="90">
          <template #default="{ row }">
            <ElTag type="warning" size="small">待审核</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="created_at" label="注册时间" width="170" />
        <ElTableColumn label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <ElButton type="primary" link size="small" @click="viewDetail(row)">查看资料</ElButton>
            <ElButton type="success" link size="small" @click="doReview(row, 'approved')">通过</ElButton>
            <ElButton type="danger" link size="small" @click="showReject(row)">驳回</ElButton>
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

    <ElDialog v-model="detailVisible" title="KYC资料" width="600px">
      <template v-if="detailData">
        <ElDescriptions :column="2" border>
          <ElDescriptionsItem label="真实姓名">{{ detailData.real_name }}</ElDescriptionsItem>
          <ElDescriptionsItem label="证件号码">{{ detailData.id_card }}</ElDescriptionsItem>
          <ElDescriptionsItem label="邮箱">{{ detailData.email }}</ElDescriptionsItem>
          <ElDescriptionsItem label="提交时间">{{ detailData.kyc_submitted_at }}</ElDescriptionsItem>
        </ElDescriptions>
        <div class="kyc-images mt-4">
          <div class="image-item" v-if="detailData.kyc_front_image">
            <p>证件正面</p>
            <ElImage :src="detailData.kyc_front_image" fit="contain" style="width: 250px; height: 160px" />
          </div>
          <div class="image-item" v-if="detailData.kyc_back_image">
            <p>证件反面</p>
            <ElImage :src="detailData.kyc_back_image" fit="contain" style="width: 250px; height: 160px" />
          </div>
          <div class="image-item" v-if="detailData.kyc_face_image">
            <p>人脸照片</p>
            <ElImage :src="detailData.kyc_face_image" fit="contain" style="width: 250px; height: 160px" />
          </div>
        </div>
      </template>
    </ElDialog>

    <ElDialog v-model="rejectVisible" title="驳回KYC" width="400px">
      <ElInput v-model="rejectReason" type="textarea" :rows="3" placeholder="请输入驳回原因" />
      <template #footer>
        <ElButton @click="rejectVisible = false">取消</ElButton>
        <ElButton type="danger" @click="confirmReject">确定驳回</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
import { Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { fetchUsers, fetchUserDetail, reviewKyc } from '@/api/admin-users'

defineOptions({ name: 'KycReview' })

const loading = ref(false)
const tableData = ref<any[]>([])
const detailVisible = ref(false)
const detailData = ref<any>(null)
const rejectVisible = ref(false)
const rejectReason = ref('')
let rejectingUser: any = null

const pagination = reactive({ page: 1, limit: 20, total: 0 })

async function loadData() {
  loading.value = true
  try {
    const res = await fetchUsers({ page: pagination.page, pageSize: pagination.limit, kycStatus: 'pending' })
    if (res?.list) { tableData.value = res.list; pagination.total = res.pagination?.total || 0 }
  } catch { /* handled */ } finally { loading.value = false }
}

async function viewDetail(row: any) {
  const res = await fetchUserDetail(row.id)
  detailData.value = res
  detailVisible.value = true
}

async function doReview(row: any, action: string) {
  await reviewKyc(row.id, { action })
  loadData()
}

function showReject(row: any) {
  rejectingUser = row
  rejectReason.value = ''
  rejectVisible.value = true
}

async function confirmReject() {
  if (!rejectReason.value) return ElMessage.warning('请填写驳回原因')
  await reviewKyc(rejectingUser.id, { action: 'rejected', reason: rejectReason.value })
  rejectVisible.value = false
  loadData()
}

onMounted(() => loadData())
</script>

<style scoped>
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.flex-end { display: flex; justify-content: flex-end; }
.kyc-images { display: flex; gap: 16px; flex-wrap: wrap; }
.image-item p { margin-bottom: 8px; font-weight: bold; }
</style>
