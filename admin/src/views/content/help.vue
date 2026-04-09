<template>
  <div class="help-page">
    <a-page-header title="帮助文档管理">
      <template #extra>
        <a-button type="primary" @click="modal.open()">新增文档</a-button>
      </template>
    </a-page-header>
    <a-card>
      <a-table :data="tableData" :pagination="pagination" :loading="loading" @page-change="handlePageChange">
        <template #columns>
          <a-table-column title="ID" data-index="id" :width="60" />
          <a-table-column title="分类" data-index="category" :width="100" />
          <a-table-column title="标题" data-index="title" />
          <a-table-column title="排序" data-index="sortOrder" :width="80" />
          <a-table-column title="已发布" :width="80">
            <template #cell="{ record }">
              <a-tag :color="record.isPublished ? 'green' : 'gray'">{{ record.isPublished ? '是' : '否' }}</a-tag>
            </template>
          </a-table-column>
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
    <a-modal v-model:visible="modal.visible.value" :title="modal.isEdit.value ? '编辑文档' : '新增文档'" @ok="handleSubmit">
      <a-form :model="formData" layout="vertical">
        <a-form-item label="分类" required><a-select v-model="formData.category"><a-option value="trading">交易</a-option><a-option value="fee">费用</a-option><a-option value="deposit">入金</a-option><a-option value="faq">常见问题</a-option></a-select></a-form-item>
        <a-form-item label="标题" required><a-input v-model="formData.title" /></a-form-item>
        <a-form-item label="内容" required><a-textarea v-model="formData.content" :auto-size="{ minRows: 6 }" /></a-form-item>
        <a-form-item label="排序"><a-input-number v-model="formData.sortOrder" :min="0" /></a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue';
import { Message } from '@arco-design/web-vue';
import { getHelpArticles, createHelpArticle, updateHelpArticle, deleteHelpArticle } from '../../api/content';
import { useModal } from '../../composables/useModal';

const modal = useModal();
const tableData = ref([]);
const loading = ref(false);
const pagination = reactive({ current: 1, pageSize: 20, total: 0 });
const formData = reactive({ category: 'faq', title: '', content: '', sortOrder: 0 });

watch(() => modal.currentRecord.value, (r) => {
  if (r) Object.assign(formData, r); else Object.assign(formData, { category: 'faq', title: '', content: '', sortOrder: 0 });
});

async function fetchData() {
  loading.value = true;
  try { const res = await getHelpArticles({ page: pagination.current, limit: pagination.pageSize }) as any; tableData.value = res.list || res || []; pagination.total = res.pagination?.total || 0; }
  finally { loading.value = false; }
}
function handlePageChange(p: number) { pagination.current = p; fetchData(); }
async function handleSubmit() { if (modal.isEdit.value) await updateHelpArticle(modal.currentRecord.value.id, formData); else await createHelpArticle(formData); Message.success('操作成功'); modal.close(); fetchData(); }
async function handleDelete(id: number) { await deleteHelpArticle(id); Message.success('删除成功'); fetchData(); }
onMounted(fetchData);
</script>
