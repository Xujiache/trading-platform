<template>
  <div class="reward-cards-page art-full-height">
    <ElCard class="mb-4" shadow="never">
      <ElForm :model="searchForm" inline>
        <ElFormItem label="状态">
          <ElSelect v-model="searchForm.status" placeholder="全部" clearable style="width: 120px">
            <ElOption label="启用" value="active" />
            <ElOption label="禁用" value="inactive" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="奖励类型">
          <ElSelect v-model="searchForm.reward_type" placeholder="全部" clearable style="width: 120px">
            <ElOption label="赠金" value="bonus" />
            <ElOption label="优惠券" value="coupon" />
            <ElOption label="体验金" value="experience" />
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
        <span class="font-bold">奖励卡片列表</span>
        <div>
          <ElButton type="primary" @click="openDialog()">新增卡片</ElButton>
          <ElButton :icon="Refresh" circle @click="loadData" />
        </div>
      </div>

      <ElTable :data="tableData" v-loading="loading" border stripe>
        <ElTableColumn prop="id" label="ID" width="60" />
        <ElTableColumn prop="title" label="标题" width="150" show-overflow-tooltip />
        <ElTableColumn prop="description" label="描述" width="200" show-overflow-tooltip />
        <ElTableColumn prop="reward_type" label="奖励类型" width="100">
          <template #default="{ row }">
            <ElTag size="small">{{ rewardTypeMap[row.reward_type] }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="reward_amount" label="奖励金额" width="100">
          <template #default="{ row }">
            <span class="font-bold text-warning">${{ row.reward_amount }}</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="trigger_type" label="触发条件" width="120">
          <template #default="{ row }">{{ triggerTypeMap[row.trigger_type] }}</template>
        </ElTableColumn>
        <ElTableColumn prop="claim_count" label="已领取" width="80" />
        <ElTableColumn prop="sort_order" label="排序" width="70" />
        <ElTableColumn prop="status" label="状态" width="80">
          <template #default="{ row }">
            <ElTag :type="row.status === 'active' ? 'success' : 'info'" size="small">{{ row.status === 'active' ? '启用' : '禁用' }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <ElButton type="primary" size="small" link @click="openDialog(row)">编辑</ElButton>
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

    <ElDialog v-model="dialogVisible" :title="editingId ? '编辑卡片' : '新增卡片'" width="600">
      <ElForm :model="form" label-width="100px">
        <ElFormItem label="标题" required>
          <ElInput v-model="form.title" placeholder="卡片标题" />
        </ElFormItem>
        <ElFormItem label="描述">
          <ElInput v-model="form.description" type="textarea" :rows="2" placeholder="卡片描述" />
        </ElFormItem>
        <ElFormItem label="图标URL">
          <ElInput v-model="form.icon" placeholder="图标链接" />
        </ElFormItem>
        <ElFormItem label="奖励类型">
          <ElSelect v-model="form.reward_type" style="width: 100%">
            <ElOption label="赠金" value="bonus" />
            <ElOption label="优惠券" value="coupon" />
            <ElOption label="体验金" value="experience" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="奖励金额">
          <ElInputNumber v-model="form.reward_amount" :min="0" :precision="2" />
        </ElFormItem>
        <ElFormItem label="触发条件">
          <ElSelect v-model="form.trigger_type" style="width: 100%">
            <ElOption label="注册" value="register" />
            <ElOption label="首次入金" value="first_deposit" />
            <ElOption label="入金达标" value="deposit_amount" />
            <ElOption label="交易次数" value="trade_count" />
            <ElOption label="邀请好友" value="invite" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="触发阈值" v-if="form.trigger_type !== 'register'">
          <ElInputNumber v-model="form.trigger_value" :min="0" :precision="2" />
        </ElFormItem>
        <ElFormItem label="背景色">
          <ElColorPicker v-model="form.bg_color" />
        </ElFormItem>
        <ElFormItem label="排序">
          <ElInputNumber v-model="form.sort_order" :min="0" />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSwitch v-model="form.status" active-value="active" inactive-value="inactive" />
        </ElFormItem>
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
import { Refresh } from '@element-plus/icons-vue'
import { fetchRewardCards, createRewardCard, updateRewardCard, deleteRewardCard } from '@/api/admin-operation'

const rewardTypeMap: Record<string, string> = { bonus: '赠金', coupon: '优惠券', experience: '体验金' }
const triggerTypeMap: Record<string, string> = { register: '注册', first_deposit: '首次入金', deposit_amount: '入金达标', trade_count: '交易次数', invite: '邀请好友' }

const searchForm = reactive({ status: '', reward_type: '' })
const tableData = ref<any[]>([])
const loading = ref(false)
const pagination = reactive({ page: 1, pageSize: 20, total: 0 })

const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const submitLoading = ref(false)
const form = reactive({
  title: '', description: '', icon: '', reward_type: 'bonus',
  reward_amount: 0, trigger_type: 'register', trigger_value: 0,
  bg_color: '#1890FF', sort_order: 0, status: 'active' as string,
})

async function loadData() {
  loading.value = true
  try {
    const res = await fetchRewardCards({
      page: pagination.page, pageSize: pagination.pageSize,
      ...(searchForm.status ? { status: searchForm.status } : {}),
      ...(searchForm.reward_type ? { reward_type: searchForm.reward_type } : {}),
    })
    tableData.value = res?.list || []
    pagination.total = res?.pagination?.total || 0
  } finally { loading.value = false }
}

function handleSearch() { pagination.page = 1; loadData() }
function handleReset() { searchForm.status = ''; searchForm.reward_type = ''; handleSearch() }

function openDialog(row?: any) {
  editingId.value = row?.id || null
  form.title = row?.title || ''
  form.description = row?.description || ''
  form.icon = row?.icon || ''
  form.reward_type = row?.reward_type || 'bonus'
  form.reward_amount = row?.reward_amount || 0
  form.trigger_type = row?.trigger_type || 'register'
  form.trigger_value = row?.trigger_value || 0
  form.bg_color = row?.bg_color || '#1890FF'
  form.sort_order = row?.sort_order || 0
  form.status = row?.status || 'active'
  dialogVisible.value = true
}

async function handleSubmit() {
  submitLoading.value = true
  try {
    if (editingId.value) {
      await updateRewardCard(editingId.value, { ...form })
    } else {
      await createRewardCard({ ...form })
    }
    dialogVisible.value = false
    loadData()
  } finally { submitLoading.value = false }
}

async function handleDelete(id: number) {
  await deleteRewardCard(id)
  loadData()
}

onMounted(() => loadData())
</script>

<style scoped>
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.flex-end { display: flex; justify-content: flex-end; }
.text-warning { color: #faad14; }
</style>
