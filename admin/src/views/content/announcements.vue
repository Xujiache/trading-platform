<template>
  <div class="announcements-page">
    <a-page-header title="公告管理">
      <template #extra>
        <a-button type="primary" @click="modal.open()">新增公告</a-button>
      </template>
    </a-page-header>
    <a-card>
      <a-table :data="tableData" :pagination="pagination" :loading="loading" @page-change="handlePageChange">
        <template #columns>
          <a-table-column title="ID" data-index="id" :width="60" />
          <a-table-column title="标题" data-index="title" />
          <a-table-column title="类型" :width="100">
            <template #cell="{ record }">
              <a-tag>{{ { notice: '通知', activity: '活动', maintenance: '维护' }[record.type as string] }}</a-tag>
            </template>
          </a-table-column>
          <a-table-column title="已发布" :width="80">
            <template #cell="{ record }">
              <a-tag :color="record.isPublished ? 'green' : 'gray'">{{ record.isPublished ? '是' : '否' }}</a-tag>
            </template>
          </a-table-column>
          <a-table-column title="创建时间" data-index="createdAt" :width="180" />
          <a-table-column title="操作" :width="160">
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
    <a-modal v-model:visible="modal.visible.value" :title="modal.isEdit.value ? '编辑公告' : '新增公告'" @ok="handleSubmit">
      <a-form :model="formData" layout="vertical">
        <a-form-item label="标题" required><a-input v-model="formData.title" /></a-form-item>
        <a-form-item label="类型"><a-select v-model="formData.type"><a-option value="notice">通知</a-option><a-option value="activity">活动</a-option><a-option value="maintenance">维护</a-option></a-select></a-form-item>
        <a-form-item label="内容" required><a-textarea v-model="formData.content" :auto-size="{ minRows: 4 }" /></a-form-item>
        <a-form-item label="发布"><a-switch v-model="formData.isPublished" /></a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue';
import { Message } from '@arco-design/web-vue';
import { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } from '../../api/content';
import { useModal } from '../../composables/useModal';

const modal = useModal();
const tableData = ref([]);
const loading = ref(false);
const pagination = reactive({ current: 1, pageSize: 20, total: 0 });
const formData = reactive({ title: '', type: 'notice', content: '', isPublished: false });

watch(() => modal.currentRecord.value, (r) => {
  if (r) { Object.assign(formData, r); } else { Object.assign(formData, { title: '', type: 'notice', content: '', isPublished: false }); }
});

async function fetchData() {
  loading.value = true;
  try {
    const res = await getAnnouncements({ page: pagination.current, limit: pagination.pageSize }) as any;
    tableData.value = res.list || res || [];
    pagination.total = res.pagination?.total || 0;
  } finally { loading.value = false; }
}

function handlePageChange(p: number) { pagination.current = p; fetchData(); }

async function handleSubmit() {
  if (modal.isEdit.value) { await updateAnnouncement(modal.currentRecord.value.id, formData); }
  else { await createAnnouncement(formData); }
  Message.success('操作成功'); modal.close(); fetchData();
}

async function handleDelete(id: number) { await deleteAnnouncement(id); Message.success('删除成功'); fetchData(); }

onMounted(fetchData);
</script>
