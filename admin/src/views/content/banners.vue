<template>
  <div class="banners-page">
    <a-page-header title="Banner 管理">
      <template #extra><a-button type="primary" @click="modal.open()">新增 Banner</a-button></template>
    </a-page-header>
    <a-card>
      <a-table :data="tableData" :loading="loading" :pagination="false">
        <template #columns>
          <a-table-column title="ID" data-index="id" :width="60" />
          <a-table-column title="标题" data-index="title" />
          <a-table-column title="图片" :width="120">
            <template #cell="{ record }"><a-image :src="record.image" width="80" height="40" fit="cover" /></template>
          </a-table-column>
          <a-table-column title="排序" data-index="sortOrder" :width="80" />
          <a-table-column title="状态" :width="80">
            <template #cell="{ record }"><a-tag :color="record.isPublished ? 'green' : 'gray'">{{ record.isPublished ? '已发布' : '未发布' }}</a-tag></template>
          </a-table-column>
          <a-table-column title="操作" :width="160">
            <template #cell="{ record }">
              <a-button type="text" size="small" @click="modal.open(record)">编辑</a-button>
              <a-popconfirm content="确定删除？" @ok="handleDelete(record.id)"><a-button type="text" status="danger" size="small">删除</a-button></a-popconfirm>
            </template>
          </a-table-column>
        </template>
      </a-table>
    </a-card>
    <a-modal v-model:visible="modal.visible.value" :title="modal.isEdit.value ? '编辑 Banner' : '新增 Banner'" @ok="handleSubmit">
      <a-form :model="formData" layout="vertical">
        <a-form-item label="标题" required><a-input v-model="formData.title" /></a-form-item>
        <a-form-item label="图片链接" required><a-input v-model="formData.image" /></a-form-item>
        <a-form-item label="链接类型"><a-select v-model="formData.linkType" allow-clear><a-option value="page">页面</a-option><a-option value="url">外链</a-option><a-option value="none">无</a-option></a-select></a-form-item>
        <a-form-item label="链接值"><a-input v-model="formData.linkValue" /></a-form-item>
        <a-form-item label="排序"><a-input-number v-model="formData.sortOrder" :min="0" /></a-form-item>
        <a-form-item label="发布"><a-switch v-model="formData.isPublished" /></a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue';
import { Message } from '@arco-design/web-vue';
import { getBanners, createBanner, updateBanner, deleteBanner } from '../../api/content';
import { useModal } from '../../composables/useModal';

const modal = useModal();
const tableData = ref([]);
const loading = ref(false);
const formData = reactive({ title: '', image: '', linkType: '', linkValue: '', sortOrder: 0, isPublished: true });

watch(() => modal.currentRecord.value, (r) => { if (r) Object.assign(formData, r); else Object.assign(formData, { title: '', image: '', linkType: '', linkValue: '', sortOrder: 0, isPublished: true }); });

async function fetchData() { loading.value = true; try { const res = await getBanners() as any; tableData.value = res.list || res || []; } finally { loading.value = false; } }
async function handleSubmit() { if (modal.isEdit.value) await updateBanner(modal.currentRecord.value.id, formData); else await createBanner(formData); Message.success('操作成功'); modal.close(); fetchData(); }
async function handleDelete(id: number) { await deleteBanner(id); Message.success('删除成功'); fetchData(); }
onMounted(fetchData);
</script>
