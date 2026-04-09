<template>
  <div class="kyc-page">
    <a-page-header title="KYC审核" />
    <a-card>
      <a-table :data="tableData" :loading="loading">
        <template #columns>
          <a-table-column title="ID" data-index="id" :width="60" />
          <a-table-column title="手机号" data-index="phone" :width="120" />
          <a-table-column title="真实姓名" data-index="realName" :width="100" />
          <a-table-column title="身份证号" data-index="idCard" :width="180" />
          <a-table-column title="提交时间" data-index="updatedAt" :width="160" />
          <a-table-column title="操作" :width="160">
            <template #cell="{ record }">
              <a-space>
                <a-button type="primary" size="small" @click="handleReview(record, 'approved')">通过</a-button>
                <a-button type="outline" status="danger" size="small" @click="handleReview(record, 'rejected')">驳回</a-button>
              </a-space>
            </template>
          </a-table-column>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
/**
 * KYC 审核页面
 * 展示待审核的实名认证申请，支持通过/驳回操作
 */
import { ref, onMounted } from 'vue';
import { getPendingKyc, reviewKyc } from '../../api/user';
import { Message } from '@arco-design/web-vue';

const loading = ref(false);
const tableData = ref<Record<string, unknown>[]>([]);

async function fetchData() {
  loading.value = true;
  try {
    const res = (await getPendingKyc()) as unknown as { list: Record<string, unknown>[] };
    tableData.value = res.list;
  } catch { /* handled */ } finally {
    loading.value = false;
  }
}

async function handleReview(record: Record<string, unknown>, status: string) {
  try {
    await reviewKyc(record.id as number, { status });
    Message.success(status === 'approved' ? 'KYC已通过' : 'KYC已驳回');
    fetchData();
  } catch { /* handled */ }
}

onMounted(() => fetchData());
</script>
