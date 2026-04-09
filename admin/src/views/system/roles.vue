<template>
  <div class="roles-page">
    <a-page-header title="角色管理">
      <template #extra>
        <a-button type="primary" @click="showModal = true">新增角色</a-button>
      </template>
    </a-page-header>

    <a-card>
      <a-table :data="tableData" :loading="loading">
        <template #columns>
          <a-table-column title="ID" data-index="id" :width="60" />
          <a-table-column title="角色名" data-index="name" :width="120" />
          <a-table-column title="显示名" data-index="displayName" :width="120" />
          <a-table-column title="描述" data-index="description" />
          <a-table-column title="状态" :width="80">
            <template #cell="{ record }">
              <a-tag :color="record.status === 1 ? 'green' : 'red'">
                {{ record.status === 1 ? '启用' : '禁用' }}
              </a-tag>
            </template>
          </a-table-column>
          <a-table-column title="操作" :width="120">
            <template #cell="{ record }">
              <a-button v-if="record.name !== 'superadmin'" type="text" status="danger" size="small" @click="handleDelete(record)">
                删除
              </a-button>
            </template>
          </a-table-column>
        </template>
      </a-table>
    </a-card>

    <a-modal v-model:visible="showModal" title="新增角色" @ok="handleCreate">
      <a-form :model="form" layout="vertical">
        <a-form-item label="角色名" field="name">
          <a-input v-model="form.name" placeholder="如: editor" />
        </a-form-item>
        <a-form-item label="显示名" field="displayName">
          <a-input v-model="form.displayName" placeholder="如: 编辑" />
        </a-form-item>
        <a-form-item label="描述" field="description">
          <a-input v-model="form.description" placeholder="角色描述" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
/**
 * 角色管理页面
 * 角色列表展示、新增、删除
 */
import { ref, reactive, onMounted } from 'vue';
import { getRoleList, createRole, deleteRole } from '../../api/system';
import { Message, Modal } from '@arco-design/web-vue';

const loading = ref(false);
const showModal = ref(false);
const tableData = ref<Record<string, unknown>[]>([]);

const form = reactive({ name: '', displayName: '', description: '' });

async function fetchData() {
  loading.value = true;
  try {
    tableData.value = (await getRoleList()) as unknown as Record<string, unknown>[];
  } catch { /* handled */ } finally {
    loading.value = false;
  }
}

async function handleCreate() {
  try {
    await createRole({ ...form, permissions: [] });
    Message.success('创建成功');
    showModal.value = false;
    form.name = '';
    form.displayName = '';
    form.description = '';
    fetchData();
  } catch { /* handled */ }
}

function handleDelete(record: Record<string, unknown>) {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除角色 "${record.displayName}" 吗？`,
    onOk: async () => {
      try {
        await deleteRole(record.id as number);
        Message.success('删除成功');
        fetchData();
      } catch { /* handled */ }
    },
  });
}

onMounted(() => fetchData());
</script>
