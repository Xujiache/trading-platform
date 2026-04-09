<template>
  <div class="reward-cards-page">
    <a-page-header title="奖励卡片管理">
      <template #extra><a-button type="primary" @click="modal.open()">新增卡片</a-button></template>
    </a-page-header>
    <a-card>
      <a-table :data="tableData" :loading="loading" :pagination="false">
        <template #columns>
          <a-table-column title="ID" data-index="id" :width="60" />
          <a-table-column title="标题" data-index="title" />
          <a-table-column title="描述" data-index="description" />
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
    <a-modal v-model:visible="modal.visible.value" :title="modal.isEdit.value ? '编辑卡片' : '新增卡片'" @ok="handleSubmit">
      <a-form :model="formData" layout="vertical">
        <a-form-item label="标题" required><a-input v-model="formData.title" /></a-form-item>
        <a-form-item label="描述" required><a-input v-model="formData.description" /></a-form-item>
        <a-form-item label="图标"><a-input v-model="formData.icon" /></a-form-item>
        <a-form-item label="背景色"><a-input v-model="formData.bgColor" placeholder="#f0f0f0" /></a-form-item>
        <a-form-item label="排序"><a-input-number v-model="formData.sortOrder" :min="0" /></a-form-item>
        <a-form-item label="发布"><a-switch v-model="formData.isPublished" /></a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue';
import { Message } from '@arco-design/web-vue';
import { getRewardCards, createRewardCard, updateRewardCard, deleteRewardCard } from '../../api/content';
import { useModal } from '../../composables/useModal';

const modal = useModal();
const tableData = ref([]);
const loading = ref(false);
const formData = reactive({ title: '', description: '', icon: '', bgColor: '', sortOrder: 0, isPublished: true });

watch(() => modal.currentRecord.value, (r) => { if (r) Object.assign(formData, r); else Object.assign(formData, { title: '', description: '', icon: '', bgColor: '', sortOrder: 0, isPublished: true }); });

async function fetchData() { loading.value = true; try { const res = await getRewardCards() as any; tableData.value = res.list || res || []; } finally { loading.value = false; } }
async function handleSubmit() { if (modal.isEdit.value) await updateRewardCard(modal.currentRecord.value.id, formData); else await createRewardCard(formData); Message.success('操作成功'); modal.close(); fetchData(); }
async function handleDelete(id: number) { await deleteRewardCard(id); Message.success('删除成功'); fetchData(); }
onMounted(fetchData);
</script>
