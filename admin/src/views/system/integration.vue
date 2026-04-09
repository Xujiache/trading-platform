<template>
  <div class="integration-page">
    <a-page-header title="第三方接口管理" />
    <a-card>
      <a-table :data="tableData" :loading="loading" :pagination="false">
        <template #columns>
          <a-table-column title="配置项" data-index="configKey" :width="200" />
          <a-table-column title="值" data-index="configValue" />
          <a-table-column title="说明" data-index="description" :width="200" />
          <a-table-column title="操作" :width="200">
            <template #cell="{ record }">
              <a-button type="text" size="small" @click="handleEdit(record)">编辑</a-button>
              <a-button type="text" size="small" @click="handleTest(record.id)" :loading="testingId === record.id">测试连通</a-button>
            </template>
          </a-table-column>
        </template>
      </a-table>
    </a-card>
    <a-modal v-model:visible="editVisible" title="编辑配置" @ok="handleSave">
      <a-form :model="editForm" layout="vertical">
        <a-form-item label="配置值"><a-textarea v-model="editForm.configValue" :auto-size="{ minRows: 2 }" /></a-form-item>
        <a-form-item label="说明"><a-input v-model="editForm.description" /></a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { Message } from '@arco-design/web-vue';
import request from '../../utils/request';

const tableData = ref([]);
const loading = ref(false);
const editVisible = ref(false);
const editForm = reactive({ id: 0, configValue: '', description: '' });
const testingId = ref(0);

async function fetchData() {
  loading.value = true;
  try { tableData.value = (await request.get('/integration')) as any || []; } finally { loading.value = false; }
}

function handleEdit(record: any) { Object.assign(editForm, record); editVisible.value = true; }

async function handleSave() {
  await request.put(`/integration/${editForm.id}`, { configValue: editForm.configValue, description: editForm.description });
  Message.success('更新成功'); editVisible.value = false; fetchData();
}

async function handleTest(id: number) {
  testingId.value = id;
  try {
    const res = await request.post(`/integration/${id}/test`) as any;
    if (res.success) Message.success(res.message); else Message.error(res.message);
  } finally { testingId.value = 0; }
}

onMounted(fetchData);
</script>
