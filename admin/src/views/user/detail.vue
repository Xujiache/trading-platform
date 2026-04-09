<template>
  <div class="user-detail-page">
    <a-page-header title="用户详情" @back="$router.back()" />
    <a-spin :loading="loading">
      <a-card title="基本信息">
        <a-descriptions :column="3">
          <a-descriptions-item label="ID">{{ user.id }}</a-descriptions-item>
          <a-descriptions-item label="手机号">{{ user.phone || '-' }}</a-descriptions-item>
          <a-descriptions-item label="邮箱">{{ user.email || '-' }}</a-descriptions-item>
          <a-descriptions-item label="昵称">{{ user.nickname || '-' }}</a-descriptions-item>
          <a-descriptions-item label="真实姓名">{{ user.realName || '-' }}</a-descriptions-item>
          <a-descriptions-item label="用户等级">{{ user.userLevel?.displayName || '-' }}</a-descriptions-item>
          <a-descriptions-item label="KYC状态">
            <a-tag :color="kycColor(user.kycStatus)">{{ kycText(user.kycStatus) }}</a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="状态">
            <a-tag :color="user.status === 1 ? 'green' : 'red'">
              {{ user.status === 1 ? '正常' : user.status === 2 ? '冻结' : '禁用' }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="注册时间">{{ user.createdAt }}</a-descriptions-item>
          <a-descriptions-item label="最后登录">{{ user.lastLoginAt || '-' }}</a-descriptions-item>
          <a-descriptions-item label="登录IP">{{ user.lastLoginIp || '-' }}</a-descriptions-item>
        </a-descriptions>
      </a-card>

      <a-card title="资金账户" style="margin-top: 16px">
        <a-descriptions :column="3">
          <a-descriptions-item label="账户余额">{{ account.balance }}</a-descriptions-item>
          <a-descriptions-item label="冻结金额">{{ account.frozenBalance }}</a-descriptions-item>
          <a-descriptions-item label="已用保证金">{{ account.usedMargin }}</a-descriptions-item>
          <a-descriptions-item label="浮动盈亏">{{ account.floatingPnl }}</a-descriptions-item>
          <a-descriptions-item label="累计入金">{{ account.totalDeposit }}</a-descriptions-item>
          <a-descriptions-item label="累计出金">{{ account.totalWithdraw }}</a-descriptions-item>
        </a-descriptions>
      </a-card>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { getUserDetail } from '../../api/user';

const route = useRoute();
const loading = ref(false);
const user = ref<any>({});
const account = ref<any>({});

function kycColor(s: string) {
  return { none: 'gray', pending: 'orange', approved: 'green', rejected: 'red' }[s] || 'gray';
}

function kycText(s: string) {
  return { none: '未认证', pending: '审核中', approved: '已通过', rejected: '已驳回' }[s] || '-';
}

onMounted(async () => {
  loading.value = true;
  try {
    const data = await getUserDetail(Number(route.params.id)) as any;
    user.value = data;
    account.value = data.fundAccount || {};
  } finally {
    loading.value = false;
  }
});
</script>
