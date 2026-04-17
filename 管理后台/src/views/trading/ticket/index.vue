<template>
  <div class="ticket-page art-full-height">
    <ElTabs v-model="activeTab" type="border-card">
      <ElTabPane label="工单管理" name="tickets">
        <ElCard shadow="never">
          <ElForm inline class="mb-4">
            <ElFormItem label="状态">
              <ElSelect v-model="ticketFilter.status" placeholder="全部" clearable style="width: 120px" @change="loadTickets">
                <ElOption label="待处理" value="pending" />
                <ElOption label="处理中" value="processing" />
                <ElOption label="已解决" value="resolved" />
                <ElOption label="已关闭" value="closed" />
              </ElSelect>
            </ElFormItem>
            <ElFormItem label="分类">
              <ElSelect v-model="ticketFilter.category" placeholder="全部" clearable style="width: 120px" @change="loadTickets">
                <ElOption label="交易" value="trade" />
                <ElOption label="资金" value="fund" />
                <ElOption label="账户" value="account" />
                <ElOption label="技术" value="technical" />
                <ElOption label="其他" value="other" />
              </ElSelect>
            </ElFormItem>
          </ElForm>

          <ElTable :data="ticketData" v-loading="ticketLoading" border stripe>
            <ElTableColumn prop="ticket_no" label="工单号" width="200" show-overflow-tooltip />
            <ElTableColumn prop="user_email" label="用户" width="160" show-overflow-tooltip />
            <ElTableColumn prop="category" label="分类" width="80">
              <template #default="{ row }">{{ getCategoryText(row.category) }}</template>
            </ElTableColumn>
            <ElTableColumn prop="title" label="标题" show-overflow-tooltip />
            <ElTableColumn prop="status" label="状态" width="80">
              <template #default="{ row }">
                <ElTag :type="getTicketStatusType(row.status)" size="small">{{ getTicketStatusText(row.status) }}</ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn prop="created_at" label="创建时间" width="170" />
            <ElTableColumn label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <ElButton type="primary" link size="small" @click="showTicketDetail(row)">查看</ElButton>
                <ElButton v-if="row.status !== 'closed'" type="success" link size="small" @click="showReplyDialog(row)">回复</ElButton>
                <ElButton v-if="row.status === 'processing'" type="warning" link size="small" @click="handleResolveTicket(row.id)">已解决</ElButton>
                <ElButton v-if="row.status !== 'closed'" type="danger" link size="small" @click="handleCloseTicket(row.id)">关闭</ElButton>
              </template>
            </ElTableColumn>
          </ElTable>
          <div class="mt-4 flex-end">
            <ElPagination v-model:current-page="ticketPage.page" v-model:page-size="ticketPage.limit"
              :total="ticketPage.total" layout="total, prev, pager, next" background @current-change="loadTickets" />
          </div>
        </ElCard>
      </ElTabPane>

      <ElTabPane label="帮助文档" name="help">
        <ElCard shadow="never">
          <div class="flex-between mb-4">
            <span class="font-bold">帮助文档</span>
            <ElButton type="primary" @click="showHelpDialog()">创建文档</ElButton>
          </div>
          <ElTable :data="helpData" v-loading="helpLoading" border stripe>
            <ElTableColumn prop="id" label="ID" width="60" />
            <ElTableColumn prop="title" label="标题" show-overflow-tooltip />
            <ElTableColumn prop="category" label="分类" width="100">
              <template #default="{ row }">{{ getHelpCategoryText(row.category) }}</template>
            </ElTableColumn>
            <ElTableColumn prop="status" label="状态" width="80">
              <template #default="{ row }">
                <ElTag :type="row.status === 'published' ? 'success' : 'info'" size="small">
                  {{ row.status === 'published' ? '已发布' : '草稿' }}
                </ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn prop="sort_order" label="排序" width="60" />
            <ElTableColumn prop="view_count" label="浏览" width="60" />
            <ElTableColumn label="操作" width="160" fixed="right">
              <template #default="{ row }">
                <ElButton type="primary" link size="small" @click="showHelpDialog(row)">编辑</ElButton>
                <ElButton type="danger" link size="small" @click="handleDeleteHelp(row.id)">删除</ElButton>
              </template>
            </ElTableColumn>
          </ElTable>
          <div class="mt-4 flex-end">
            <ElPagination v-model:current-page="helpPage.page" v-model:page-size="helpPage.limit"
              :total="helpPage.total" layout="total, prev, pager, next" background @current-change="loadHelp" />
          </div>
        </ElCard>
      </ElTabPane>
    </ElTabs>

    <ElDialog v-model="ticketDetailVisible" title="工单详情" width="600px">
      <template v-if="ticketDetail">
        <ElDescriptions :column="2" border>
          <ElDescriptionsItem label="工单号">{{ ticketDetail.ticket_no }}</ElDescriptionsItem>
          <ElDescriptionsItem label="用户">{{ ticketDetail.user_email }}</ElDescriptionsItem>
          <ElDescriptionsItem label="分类">{{ getCategoryText(ticketDetail.category) }}</ElDescriptionsItem>
          <ElDescriptionsItem label="状态">{{ getTicketStatusText(ticketDetail.status) }}</ElDescriptionsItem>
          <ElDescriptionsItem label="标题" :span="2">{{ ticketDetail.title }}</ElDescriptionsItem>
          <ElDescriptionsItem label="内容" :span="2">{{ ticketDetail.content }}</ElDescriptionsItem>
          <ElDescriptionsItem label="回复" :span="2">{{ ticketDetail.reply_content || '暂无回复' }}</ElDescriptionsItem>
        </ElDescriptions>
      </template>
    </ElDialog>

    <ElDialog v-model="replyVisible" title="回复工单" width="500px">
      <ElInput v-model="replyContent" type="textarea" :rows="4" placeholder="请输入回复内容" />
      <template #footer>
        <ElButton @click="replyVisible = false">取消</ElButton>
        <ElButton type="primary" @click="doReply">回复</ElButton>
      </template>
    </ElDialog>

    <ElDialog v-model="helpVisible" :title="helpEditId ? '编辑文档' : '创建文档'" width="600px">
      <ElForm :model="helpForm" label-width="80px">
        <ElFormItem label="标题"><ElInput v-model="helpForm.title" /></ElFormItem>
        <ElFormItem label="分类">
          <ElSelect v-model="helpForm.category" style="width: 100%">
            <ElOption label="交易规则" value="trading_rules" />
            <ElOption label="费用说明" value="fee_info" />
            <ElOption label="出入金" value="deposit_withdraw" />
            <ElOption label="常见问题" value="faq" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="内容"><ElInput v-model="helpForm.content" type="textarea" :rows="8" /></ElFormItem>
        <ElFormItem label="状态">
          <ElSelect v-model="helpForm.status" style="width: 100%">
            <ElOption label="已发布" value="published" />
            <ElOption label="草稿" value="draft" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="排序"><ElInputNumber v-model="helpForm.sort_order" :min="0" style="width: 100%" /></ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="helpVisible = false">取消</ElButton>
        <ElButton type="primary" @click="doSaveHelp">保存</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
import { ElMessageBox } from 'element-plus'
import { fetchTickets, fetchTicketDetail, replyTicket, resolveTicket, closeTicket, fetchHelpDocs, createHelpDoc, updateHelpDoc, deleteHelpDoc } from '@/api/admin-ticket'

defineOptions({ name: 'TicketManage' })

const activeTab = ref('tickets')

const ticketLoading = ref(false)
const ticketData = ref<any[]>([])
const ticketFilter = ref({ status: '', category: '' })
const ticketPage = reactive({ page: 1, limit: 20, total: 0 })
const ticketDetailVisible = ref(false)
const ticketDetail = ref<any>(null)
const replyVisible = ref(false)
const replyContent = ref('')
let replyingId = 0

const helpLoading = ref(false)
const helpData = ref<any[]>([])
const helpPage = reactive({ page: 1, limit: 20, total: 0 })
const helpVisible = ref(false)
const helpEditId = ref(0)
const helpForm = ref({ title: '', content: '', category: 'faq', status: 'published', sort_order: 0 })

function getCategoryText(c: string) {
  const map: Record<string, string> = { trade: '交易', fund: '资金', account: '账户', technical: '技术', other: '其他' }
  return map[c] || c
}
function getTicketStatusText(s: string) {
  const map: Record<string, string> = { pending: '待处理', processing: '处理中', resolved: '已解决', closed: '已关闭' }
  return map[s] || s
}
function getTicketStatusType(s: string) {
  const map: Record<string, string> = { pending: 'danger', processing: 'warning', resolved: 'success', closed: 'info' }
  return (map[s] || 'info') as any
}
function getHelpCategoryText(c: string) {
  const map: Record<string, string> = { trading_rules: '交易规则', fee_info: '费用说明', deposit_withdraw: '出入金', faq: '常见问题' }
  return map[c] || c
}

async function loadTickets() {
  ticketLoading.value = true
  try {
    const params: any = { page: ticketPage.page, pageSize: ticketPage.limit }
    if (ticketFilter.value.status) params.status = ticketFilter.value.status
    if (ticketFilter.value.category) params.category = ticketFilter.value.category
    const res = await fetchTickets(params)
    if (res?.list) { ticketData.value = res.list; ticketPage.total = res.pagination?.total || 0 }
  } catch { /* handled */ } finally { ticketLoading.value = false }
}

async function showTicketDetail(row: any) {
  ticketDetail.value = await fetchTicketDetail(row.id)
  ticketDetailVisible.value = true
}

function showReplyDialog(row: any) {
  replyingId = row.id; replyContent.value = ''; replyVisible.value = true
}

async function doReply() {
  await replyTicket(replyingId, { reply_content: replyContent.value })
  replyVisible.value = false; loadTickets()
}

async function handleResolveTicket(id: number) {
  await resolveTicket(id)
  loadTickets()
}

function handleCloseTicket(id: number) {
  ElMessageBox.confirm('确定关闭此工单？', '关闭工单', { type: 'warning' })
    .then(async () => { await closeTicket(id); loadTickets() }).catch(() => {})
}

async function loadHelp() {
  helpLoading.value = true
  try {
    const res = await fetchHelpDocs({ page: helpPage.page, pageSize: helpPage.limit })
    if (res?.list) { helpData.value = res.list; helpPage.total = res.pagination?.total || 0 }
  } catch { /* handled */ } finally { helpLoading.value = false }
}

function showHelpDialog(row?: any) {
  if (row) {
    helpEditId.value = row.id
    helpForm.value = { title: row.title, content: row.content, category: row.category, status: row.status, sort_order: row.sort_order }
  } else {
    helpEditId.value = 0
    helpForm.value = { title: '', content: '', category: 'faq', status: 'published', sort_order: 0 }
  }
  helpVisible.value = true
}

async function doSaveHelp() {
  if (helpEditId.value) await updateHelpDoc(helpEditId.value, helpForm.value)
  else await createHelpDoc(helpForm.value)
  helpVisible.value = false; loadHelp()
}

function handleDeleteHelp(id: number) {
  ElMessageBox.confirm('确定删除此文档？', '删除', { type: 'warning' })
    .then(async () => { await deleteHelpDoc(id); loadHelp() }).catch(() => {})
}

watch(activeTab, (tab) => {
  if (tab === 'tickets') loadTickets()
  else loadHelp()
})

onMounted(() => loadTickets())
</script>

<style scoped>
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.flex-end { display: flex; justify-content: flex-end; }
</style>
