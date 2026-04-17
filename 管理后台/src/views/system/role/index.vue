<!-- 角色管理页面 -->
<template>
  <div class="art-full-height">
    <ElCard shadow="never">
      <ElForm inline class="mb-4">
        <ElFormItem label="关键词">
          <ElInput v-model="keyword" placeholder="角色名称/标识" clearable style="width: 200px" @keyup.enter="handleSearch" />
        </ElFormItem>
        <ElFormItem>
          <ElButton type="primary" @click="handleSearch">搜索</ElButton>
          <ElButton @click="handleReset">重置</ElButton>
          <ElButton type="success" @click="showDialog('add')">新增角色</ElButton>
        </ElFormItem>
      </ElForm>

      <ElTable :data="tableData" v-loading="loading" border stripe>
        <ElTableColumn prop="id" label="ID" width="80" />
        <ElTableColumn prop="name" label="角色标识" width="150" />
        <ElTableColumn prop="display_name" label="显示名称" width="150" />
        <ElTableColumn prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <ElTableColumn label="权限" min-width="200">
          <template #default="{ row }">
            <ElTag v-for="p in parsePermissions(row.permissions)" :key="p" size="small" class="mr-1 mb-1">{{ p }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="is_system" label="系统内置" width="90">
          <template #default="{ row }">
            <ElTag :type="row.is_system ? 'warning' : 'info'" size="small">{{ row.is_system ? '是' : '否' }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="status" label="状态" width="80">
          <template #default="{ row }">
            <ElTag :type="row.status === 1 ? 'success' : 'danger'" size="small">{{ row.status === 1 ? '启用' : '禁用' }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="sort_order" label="排序" width="70" />
        <ElTableColumn prop="created_at" label="创建时间" width="180" />
        <ElTableColumn label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <ElButton link type="primary" size="small" @click="showDialog('edit', row)">编辑</ElButton>
            <ElButton link type="primary" size="small" @click="showPermissionDialog(row)">权限</ElButton>
            <ElButton link type="danger" size="small" @click="handleDelete(row)" :disabled="row.is_system === 1">删除</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>

      <div class="flex justify-end mt-4">
        <ElPagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </ElCard>

    <RoleEditDialog v-model="dialogVisible" :dialog-type="dialogType" :role-data="currentRole" @success="loadData" />
    <RolePermissionDialog v-model="permissionVisible" :role-data="currentRole" @success="loadData" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { fetchRoleList, deleteRole as deleteRoleApi, type RoleItem } from '@/api/admin-role'
import { ElMessage, ElMessageBox } from 'element-plus'
import RoleEditDialog from './modules/role-edit-dialog.vue'
import RolePermissionDialog from './modules/role-permission-dialog.vue'

defineOptions({ name: 'Role' })

const keyword = ref('')
const tableData = ref<RoleItem[]>([])
const loading = ref(false)
const pagination = ref({ page: 1, pageSize: 20, total: 0 })
const dialogVisible = ref(false)
const permissionVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const currentRole = ref<RoleItem | undefined>(undefined)

function parsePermissions(perms: any): string[] {
  if (Array.isArray(perms)) return perms
  if (typeof perms === 'string') {
    try { return JSON.parse(perms) } catch { return [] }
  }
  return []
}

async function loadData() {
  loading.value = true
  try {
    const res = await fetchRoleList({
      keyword: keyword.value || undefined,
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
    })
    tableData.value = res?.list || []
    pagination.value.total = res?.pagination?.total || 0
  } catch {} finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.value.page = 1
  loadData()
}

function handleReset() {
  keyword.value = ''
  pagination.value.page = 1
  loadData()
}

function showDialog(type: 'add' | 'edit', row?: RoleItem) {
  dialogType.value = type
  currentRole.value = row
  dialogVisible.value = true
}

function showPermissionDialog(row: RoleItem) {
  currentRole.value = row
  permissionVisible.value = true
}

async function handleDelete(row: RoleItem) {
  if (row.is_system) {
    ElMessage.warning('系统内置角色不可删除')
    return
  }
  try {
    await ElMessageBox.confirm(`确定删除角色"${row.display_name}"吗？此操作不可恢复！`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await deleteRoleApi(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch {}
}

onMounted(() => {
  loadData()
})
</script>
