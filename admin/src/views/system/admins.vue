<template>
  <div class="admins-page">
    <a-page-header title="管理员管理">
      <template #extra>
        <a-button type="primary" @click="showModal = true">新增管理员</a-button>
      </template>
    </a-page-header>

    <a-card>
      <a-table :data="tableData" :loading="loading">
        <template #columns>
          <a-table-column title="ID" data-index="id" :width="60" />
          <a-table-column title="用户名" data-index="username" :width="120" />
          <a-table-column title="姓名" data-index="realName" :width="100" />
          <a-table-column title="角色" :width="120">
            <template #cell="{ record }">
              {{ record.role?.displayName || '-' }}
            </template>
          </a-table-column>
          <a-table-column title="状态" :width="80">
            <template #cell="{ record }">
              <a-tag :color="record.status === 1 ? 'green' : 'red'">
                {{ record.status === 1 ? '启用' : '禁用' }}
              </a-tag>
            </template>
          </a-table-column>
          <a-table-column title="操作" :width="120">
            <template #cell="{ record }">
              <a-button type="text" size="small" @click="toggleStatus(record)">
                {{ record.status === 1 ? '禁用' : '启用' }}
              </a-button>
            </template>
          </a-table-column>
        </template>
      </a-table>
    </a-card>

    <a-modal v-model:visible="showModal" title="新增管理员" @ok="handleCreate">
      <a-form :model="form" layout="vertical">
        <a-form-item label="用户名" field="username">
          <a-input v-model="form.username" placeholder="请输入用户名" />
        </a-form-item>
        <a-form-item label="密码" field="password">
          <a-input-password v-model="form.password" placeholder="请输入密码" />
        </a-form-item>
        <a-form-item label="姓名" field="realName">
          <a-input v-model="form.realName" placeholder="请输入姓名" />
        </a-form-item>
        <a-form-item label="角色" field="roleId">
          <a-select v-model="form.roleId" placeholder="请选择角色">
            <a-option v-for="role in roles" :key="role.id" :value="role.id">
              {{ role.displayName }}
            </a-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
/**
 * 管理员管理页面
 * 管理员列表展示、新增、启用/禁用
 */
import { ref, reactive, onMounted } from 'vue';
import { getAdminList, createAdmin, updateAdminStatus } from '../../api/system';
import { getRoleList } from '../../api/system';
import { Message } from '@arco-design/web-vue';

const loading = ref(false);
const showModal = ref(false);
const tableData = ref<Record<string, unknown>[]>([]);
const roles = ref<{ id: number; displayName: string }[]>([]);

const form = reactive({ username: '', password: '', realName: '', roleId: undefined as number | undefined });

async function fetchData() {
  loading.value = true;
  try {
    tableData.value = (await getAdminList()) as unknown as Record<string, unknown>[];
    roles.value = (await getRoleList()) as unknown as { id: number; displayName: string }[];
  } catch { /* handled */ } finally {
    loading.value = false;
  }
}

async function handleCreate() {
  try {
    await createAdmin(form);
    Message.success('创建成功');
    showModal.value = false;
    form.username = '';
    form.password = '';
    form.realName = '';
    form.roleId = undefined;
    fetchData();
  } catch { /* handled */ }
}

async function toggleStatus(record: Record<string, unknown>) {
  const newStatus = record.status === 1 ? 0 : 1;
  try {
    await updateAdminStatus(record.id as number, newStatus);
    Message.success(newStatus === 1 ? '已启用' : '已禁用');
    fetchData();
  } catch { /* handled */ }
}

onMounted(() => fetchData());
</script>
