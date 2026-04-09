<template>
  <div class="activities-page">
    <a-page-header title="活动管理">
      <template #extra><a-button type="primary" @click="modal.open()">新增活动</a-button></template>
    </a-page-header>
    <a-card>
      <a-table :data="tableData" :pagination="pagination" :loading="loading" @page-change="handlePageChange">
        <template #columns>
          <a-table-column title="ID" data-index="id" :width="60" />
          <a-table-column title="标题" data-index="title" />
          <a-table-column title="类型" data-index="type" :width="100" />
          <a-table-column title="状态" :width="80">
            <template #cell="{ record }">
              <a-tag :color="{ draft: 'gray', active: 'green', ended: 'red' }[record.status as string]">
                {{ { draft: '草稿', active: '进行中', ended: '已结束' }[record.status as string] }}
              </a-tag>
            </template>
          </a-table-column>
          <a-table-column title="参与人数" data-index="participantCount" :width="100" />
          <a-table-column title="开始时间" data-index="startAt" :width="160" />
          <a-table-column title="结束时间" data-index="endAt" :width="160" />
          <a-table-column title="操作" :width="200">
            <template #cell="{ record }">
              <a-button type="text" size="small" @click="modal.open(record)">编辑</a-button>
              <a-popconfirm content="确定删除？" @ok="handleDelete(record.id)">
                <a-button type="text" status="danger" size="small">删除</a-button>
              </a-popconfirm>
            </template>
          </a-table-column>
        </template>
      </a-table>
    </a-card>
    <a-modal v-model:visible="modal.visible.value" :title="modal.isEdit.value ? '编辑活动' : '新增活动'" @ok="handleSubmit">
      <a-form :model="formData" layout="vertical">
        <a-form-item label="标题" required><a-input v-model="formData.title" /></a-form-item>
        <a-form-item label="类型"><a-select v-model="formData.type"><a-option value="new_user">新手活动</a-option><a-option value="deposit_bonus">入金奖励</a-option></a-select></a-form-item>
        <a-form-item label="描述" required><a-textarea v-model="formData.description" :auto-size="{ minRows: 3 }" /></a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue';
import { Message } from '@arco-design/web-vue';
import { getActivities, createActivity, updateActivity, deleteActivity } from '../../api/content';
import { useModal } from '../../composables/useModal';

const modal = useModal();
const tableData = ref([]);
const loading = ref(false);
const pagination = reactive({ current: 1, pageSize: 20, total: 0 });
const formData = reactive({ title: '', type: 'new_user', description: '' });

watch(() => modal.currentRecord.value, (r) => { if (r) Object.assign(formData, r); else Object.assign(formData, { title: '', type: 'new_user', description: '' }); });

async function fetchData() { loading.value = true; try { const res = await getActivities({ page: pagination.current, limit: pagination.pageSize }) as any; tableData.value = res.list || res || []; pagination.total = res.pagination?.total || 0; } finally { loading.value = false; } }
function handlePageChange(p: number) { pagination.current = p; fetchData(); }
async function handleSubmit() { if (modal.isEdit.value) await updateActivity(modal.currentRecord.value.id, formData); else await createActivity(formData); Message.success('操作成功'); modal.close(); fetchData(); }
async function handleDelete(id: number) { await deleteActivity(id); Message.success('删除成功'); fetchData(); }
onMounted(fetchData);
</script>
