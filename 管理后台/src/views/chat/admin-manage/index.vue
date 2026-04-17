<template>
  <div class="admin-manage-page art-full-height">
    <ElCard shadow="never">
      <div class="flex-between mb-4">
        <span class="font-bold">管理员列表</span>
        <ElButton type="primary" @click="showDialog()">新增管理员</ElButton>
      </div>

      <ElTable :data="tableData" v-loading="loading" border stripe>
        <ElTableColumn prop="id" label="ID" width="60" />
        <ElTableColumn prop="username" label="用户名" width="120" />
        <ElTableColumn prop="real_name" label="真实姓名" width="120" />
        <ElTableColumn prop="email" label="邮箱" width="200" />
        <ElTableColumn prop="phone" label="手机" width="140" />
        <ElTableColumn prop="role_display_name" label="角色" width="120">
          <template #default="{ row }">
            <ElTag size="small">{{ row.role_display_name || row.role_name }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="status" label="状态" width="70">
          <template #default="{ row }">
            <ElTag :type="row.status ? 'success' : 'danger'" size="small">
              {{ row.status ? '正常' : '禁用' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="last_login_at" label="最后登录" width="170" />
        <ElTableColumn label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <ElButton type="primary" link size="small" @click="showDialog(row)">编辑</ElButton>
            <ElButton type="danger" link size="small" @click="handleDelete(row)">删除</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>

      <div class="mt-4 flex-end">
        <ElPagination v-model:current-page="pagination.page" v-model:page-size="pagination.limit"
          :total="pagination.total" layout="total, prev, pager, next" background
          @current-change="loadData" />
      </div>
    </ElCard>

    <ElDialog v-model="dialogVisible" :title="editId ? '编辑管理员' : '新增管理员'" width="500px">
      <ElForm :model="form" label-width="80px">
        <ElFormItem label="用户名" v-if="!editId">
          <ElInput v-model="form.username" />
        </ElFormItem>
        <ElFormItem label="密码" v-if="!editId">
          <ElInput v-model="form.password" type="password" show-password />
        </ElFormItem>
        <ElFormItem label="真实姓名"><ElInput v-model="form.real_name" /></ElFormItem>
        <ElFormItem label="邮箱"><ElInput v-model="form.email" /></ElFormItem>
        <ElFormItem label="手机"><ElInput v-model="form.phone" /></ElFormItem>
        <ElFormItem label="角色">
          <ElSelect v-model="form.role_id" style="width: 100%">
            <ElOption v-for="r in roles" :key="r.id" :label="r.display_name" :value="r.id" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="状态" v-if="editId">
          <ElSwitch v-model="form.status" :active-value="1" :inactive-value="0" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="doSave">保存</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
import { ElMessageBox } from 'element-plus'
import { fetchAdmins, createAdmin, updateAdmin, deleteAdmin } from '@/api/admin-chat'
import request from '@/utils/http'

defineOptions({ name: 'AdminManage' })

const loading = ref(false)
const tableData = ref<any[]>([])
const pagination = reactive({ page: 1, limit: 20, total: 0 })
const dialogVisible = ref(false)
const editId = ref(0)
const form = ref({ username: '', password: '', real_name: '', email: '', phone: '', role_id: 1, status: 1 })
const roles = ref<any[]>([])

async function loadData() {
  loading.value = true
  try {
    const res = await fetchAdmins({ page: pagination.page, pageSize: pagination.limit })
    if (res?.list) { tableData.value = res.list; pagination.total = res.pagination?.total || 0 }
  } catch { /* handled */ } finally { loading.value = false }
}

async function loadRoles() {
  try {
    const res = await request.get<any>({ url: '/api/admin/roles' })
    if (res?.list) roles.value = res.list
    else if (Array.isArray(res)) roles.value = res
  } catch { /* handled */ }
}

function showDialog(row?: any) {
  if (row) {
    editId.value = row.id
    form.value = { username: row.username, password: '', real_name: row.real_name, email: row.email, phone: row.phone, role_id: row.role_id, status: row.status }
  } else {
    editId.value = 0
    form.value = { username: '', password: '', real_name: '', email: '', phone: '', role_id: 1, status: 1 }
  }
  dialogVisible.value = true
}

async function doSave() {
  if (editId.value) {
    await updateAdmin(editId.value, { real_name: form.value.real_name, email: form.value.email, phone: form.value.phone, role_id: form.value.role_id, status: form.value.status })
  } else {
    await createAdmin(form.value)
  }
  dialogVisible.value = false
  loadData()
}

function handleDelete(row: any) {
  ElMessageBox.confirm(`确定删除管理员 ${row.username}？`, '删除', { type: 'warning' })
    .then(async () => { await deleteAdmin(row.id); loadData() }).catch(() => {})
}

onMounted(() => { loadData(); loadRoles() })
</script>

<style scoped>
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.flex-end { display: flex; justify-content: flex-end; }
</style>
