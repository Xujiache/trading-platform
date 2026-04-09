<template>
  <div class="user-list-page">
    <a-page-header title="用户列表" />

    <a-card>
      <div class="search-bar">
        <a-input v-model="searchForm.keyword" placeholder="搜索手机号/邮箱/昵称" style="width: 240px" allow-clear />
        <a-select v-model="searchForm.status" placeholder="用户状态" style="width: 120px" allow-clear>
          <a-option :value="1">正常</a-option>
          <a-option :value="2">冻结</a-option>
          <a-option :value="0">禁用</a-option>
        </a-select>
        <a-select v-model="searchForm.kycStatus" placeholder="KYC状态" style="width: 120px" allow-clear>
          <a-option value="none">未认证</a-option>
          <a-option value="pending">审核中</a-option>
          <a-option value="approved">已通过</a-option>
          <a-option value="rejected">已驳回</a-option>
        </a-select>
        <a-button type="primary" @click="fetchData">搜索</a-button>
      </div>

      <a-table :data="tableData" :pagination="pagination" :loading="loading" @page-change="handlePageChange">
        <template #columns>
          <a-table-column title="ID" data-index="id" :width="60" />
          <a-table-column title="手机号" data-index="phone" :width="120" />
          <a-table-column title="昵称" data-index="nickname" :width="120" />
          <a-table-column title="等级" :width="80">
            <template #cell="{ record }">
              {{ record.userLevel?.displayName || '-' }}
            </template>
          </a-table-column>
          <a-table-column title="KYC状态" :width="100">
            <template #cell="{ record }">
              <a-tag :color="kycColor(record.kycStatus)">{{ kycText(record.kycStatus) }}</a-tag>
            </template>
          </a-table-column>
          <a-table-column title="状态" :width="80">
            <template #cell="{ record }">
              <a-tag :color="record.status === 1 ? 'green' : 'red'">
                {{ record.status === 1 ? '正常' : record.status === 2 ? '冻结' : '禁用' }}
              </a-tag>
            </template>
          </a-table-column>
          <a-table-column title="注册时间" data-index="createdAt" :width="160" />
          <a-table-column title="操作" :width="160" fixed="right">
            <template #cell="{ record }">
              <a-button type="text" size="small" @click="toggleStatus(record)">
                {{ record.status === 1 ? '冻结' : '解冻' }}
              </a-button>
            </template>
          </a-table-column>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
/**
 * 用户列表管理页面
 * 支持多条件筛选、分页、冻结/解冻操作
 */
import { ref, reactive, onMounted } from 'vue';
import { getUserList, updateUserStatus } from '../../api/user';
import { Message } from '@arco-design/web-vue';

const loading = ref(false);
const tableData = ref<Record<string, unknown>[]>([]);
const searchForm = reactive({ keyword: '', status: undefined as number | undefined, kycStatus: '' });
const pagination = reactive({ current: 1, pageSize: 20, total: 0 });

function kycColor(status: string) {
  const map: Record<string, string> = { none: 'gray', pending: 'orange', approved: 'green', rejected: 'red' };
  return map[status] || 'gray';
}

function kycText(status: string) {
  const map: Record<string, string> = { none: '未认证', pending: '审核中', approved: '已通过', rejected: '已驳回' };
  return map[status] || '-';
}

async function fetchData() {
  loading.value = true;
  try {
    const res = (await getUserList({
      page: pagination.current,
      limit: pagination.pageSize,
      ...searchForm,
    })) as unknown as { list: Record<string, unknown>[]; pagination: { total: number } };
    tableData.value = res.list;
    pagination.total = res.pagination.total;
  } catch { /* handled by interceptor */ } finally {
    loading.value = false;
  }
}

function handlePageChange(page: number) {
  pagination.current = page;
  fetchData();
}

async function toggleStatus(record: Record<string, unknown>) {
  const newStatus = record.status === 1 ? 2 : 1;
  try {
    await updateUserStatus(record.id as number, newStatus);
    Message.success(newStatus === 1 ? '已解冻' : '已冻结');
    fetchData();
  } catch { /* handled */ }
}

onMounted(() => fetchData());
</script>

<style scoped>
.search-bar { display: flex; gap: 12px; margin-bottom: 16px; }
</style>
