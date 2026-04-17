<template>
  <div class="notification-page art-full-height">
    <ElTabs v-model="activeTab" type="border-card">
      <ElTabPane label="消息通知" name="notification">
        <ElCard shadow="never">
          <div class="flex-between mb-4">
            <span class="font-bold">消息列表</span>
            <ElButton type="primary" @click="showSendDialog">发送通知</ElButton>
          </div>
          <ElTable :data="notifData" v-loading="notifLoading" border stripe>
            <ElTableColumn prop="id" label="ID" width="60" />
            <ElTableColumn prop="user_email" label="用户" width="160" show-overflow-tooltip />
            <ElTableColumn prop="type" label="类型" width="80">
              <template #default="{ row }">
                <ElTag size="small">{{ typeText(row.type) }}</ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn prop="title" label="标题" show-overflow-tooltip />
            <ElTableColumn prop="is_read" label="已读" width="60">
              <template #default="{ row }">{{ row.is_read ? '是' : '否' }}</template>
            </ElTableColumn>
            <ElTableColumn prop="created_at" label="时间" width="170" />
          </ElTable>
          <div class="mt-4 flex-end">
            <ElPagination v-model:current-page="notifPage.page" v-model:page-size="notifPage.limit"
              :total="notifPage.total" layout="total, prev, pager, next" background @current-change="loadNotif" />
          </div>
        </ElCard>
      </ElTabPane>

      <ElTabPane label="公告管理" name="announcement">
        <ElCard shadow="never">
          <div class="flex-between mb-4">
            <span class="font-bold">公告列表</span>
            <ElButton type="primary" @click="showAnnouncementDialog()">创建公告</ElButton>
          </div>
          <ElTable :data="annoData" v-loading="annoLoading" border stripe>
            <ElTableColumn prop="id" label="ID" width="60" />
            <ElTableColumn prop="title" label="标题" show-overflow-tooltip />
            <ElTableColumn prop="status" label="状态" width="80">
              <template #default="{ row }">
                <ElTag :type="row.status === 'published' ? 'success' : 'info'" size="small">
                  {{ row.status === 'published' ? '已发布' : row.status === 'draft' ? '草稿' : '已归档' }}
                </ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn prop="is_top" label="置顶" width="60">
              <template #default="{ row }">{{ row.is_top ? '是' : '否' }}</template>
            </ElTableColumn>
            <ElTableColumn prop="view_count" label="浏览" width="70" />
            <ElTableColumn prop="created_at" label="创建时间" width="170" />
            <ElTableColumn label="操作" width="160" fixed="right">
              <template #default="{ row }">
                <ElButton type="primary" link size="small" @click="showAnnouncementDialog(row)">编辑</ElButton>
                <ElButton type="danger" link size="small" @click="handleDeleteAnno(row.id)">删除</ElButton>
              </template>
            </ElTableColumn>
          </ElTable>
          <div class="mt-4 flex-end">
            <ElPagination v-model:current-page="annoPage.page" v-model:page-size="annoPage.limit"
              :total="annoPage.total" layout="total, prev, pager, next" background @current-change="loadAnno" />
          </div>
        </ElCard>
      </ElTabPane>
    </ElTabs>

    <ElDialog v-model="sendVisible" title="发送通知" width="500px">
      <ElForm :model="sendForm" label-width="80px">
        <ElFormItem label="目标">
          <ElRadioGroup v-model="sendForm.target">
            <ElRadio value="all">全部用户</ElRadio>
            <ElRadio value="single">指定用户</ElRadio>
          </ElRadioGroup>
        </ElFormItem>
        <ElFormItem v-if="sendForm.target === 'single'" label="用户ID">
          <ElInputNumber v-model="sendForm.userId" :min="1" style="width: 100%" />
        </ElFormItem>
        <ElFormItem label="标题"><ElInput v-model="sendForm.title" /></ElFormItem>
        <ElFormItem label="内容"><ElInput v-model="sendForm.content" type="textarea" :rows="4" /></ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="sendVisible = false">取消</ElButton>
        <ElButton type="primary" @click="doSend">发送</ElButton>
      </template>
    </ElDialog>

    <ElDialog v-model="annoVisible" :title="annoEditId ? '编辑公告' : '创建公告'" width="700px">
      <ElForm :model="annoForm" label-width="80px">
        <ElFormItem label="标题"><ElInput v-model="annoForm.title" /></ElFormItem>
        <ElFormItem label="封面图"><ElInput v-model="annoForm.cover_image" placeholder="输入图片URL或上传路径" /></ElFormItem>
        <ElFormItem label="内容">
          <div style="width: 100%">
            <ElInput v-model="annoForm.content" type="textarea" :rows="10" placeholder="支持HTML富文本内容" />
            <div class="mt-2 text-gray" style="font-size: 12px">提示：可输入HTML富文本内容，如 &lt;p&gt;、&lt;img&gt;、&lt;h2&gt; 等标签</div>
          </div>
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSelect v-model="annoForm.status" style="width: 100%">
            <ElOption label="草稿" value="draft" />
            <ElOption label="发布" value="published" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="置顶"><ElSwitch v-model="annoForm.is_top" /></ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="annoVisible = false">取消</ElButton>
        <ElButton type="primary" @click="doSaveAnno">保存</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
import { ElMessageBox } from 'element-plus'
import { fetchNotifications, sendNotification, fetchAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } from '@/api/admin-notification'

defineOptions({ name: 'NotificationManage' })

const activeTab = ref('notification')

const notifLoading = ref(false)
const notifData = ref<any[]>([])
const notifPage = reactive({ page: 1, limit: 20, total: 0 })

const annoLoading = ref(false)
const annoData = ref<any[]>([])
const annoPage = reactive({ page: 1, limit: 20, total: 0 })

const sendVisible = ref(false)
const sendForm = ref({ target: 'all', userId: 1, title: '', content: '' })

const annoVisible = ref(false)
const annoEditId = ref(0)
const annoForm = ref({ title: '', content: '', cover_image: '', status: 'draft', is_top: false })

function typeText(t: string) {
  const map: Record<string, string> = { system: '系统', trade: '交易', fund: '资金', announcement: '公告' }
  return map[t] || t
}

async function loadNotif() {
  notifLoading.value = true
  try {
    const res = await fetchNotifications({ page: notifPage.page, pageSize: notifPage.limit })
    if (res?.list) { notifData.value = res.list; notifPage.total = res.pagination?.total || 0 }
  } catch { /* handled */ } finally { notifLoading.value = false }
}

async function loadAnno() {
  annoLoading.value = true
  try {
    const res = await fetchAnnouncements({ page: annoPage.page, pageSize: annoPage.limit })
    if (res?.list) { annoData.value = res.list; annoPage.total = res.pagination?.total || 0 }
  } catch { /* handled */ } finally { annoLoading.value = false }
}

function showSendDialog() {
  sendForm.value = { target: 'all', userId: 1, title: '', content: '' }
  sendVisible.value = true
}

async function doSend() {
  const data: any = { title: sendForm.value.title, content: sendForm.value.content }
  if (sendForm.value.target === 'all') data.allUsers = true
  else data.userId = sendForm.value.userId
  await sendNotification(data)
  sendVisible.value = false
  loadNotif()
}

function showAnnouncementDialog(row?: any) {
  if (row) {
    annoEditId.value = row.id
    annoForm.value = { title: row.title, content: row.content, cover_image: row.cover_image || '', status: row.status, is_top: !!row.is_top }
  } else {
    annoEditId.value = 0
    annoForm.value = { title: '', content: '', cover_image: '', status: 'draft', is_top: false }
  }
  annoVisible.value = true
}

async function doSaveAnno() {
  if (annoEditId.value) await updateAnnouncement(annoEditId.value, annoForm.value)
  else await createAnnouncement(annoForm.value)
  annoVisible.value = false
  loadAnno()
}

function handleDeleteAnno(id: number) {
  ElMessageBox.confirm('确定删除此公告？', '删除', { type: 'warning' })
    .then(async () => { await deleteAnnouncement(id); loadAnno() }).catch(() => {})
}

watch(activeTab, (tab) => {
  if (tab === 'notification') loadNotif()
  else if (tab === 'announcement') loadAnno()
})

onMounted(() => loadNotif())
</script>

<style scoped>
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.flex-end { display: flex; justify-content: flex-end; }
</style>
