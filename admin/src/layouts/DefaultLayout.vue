<template>
  <a-layout class="layout">
    <a-layout-sider :width="220" class="sider">
      <div class="logo">
        <span class="logo-text">寰球汇金</span>
      </div>
      <a-menu :selected-keys="selectedKeys" @menu-item-click="handleMenuClick">
        <a-menu-item key="/dashboard">
          <template #icon><icon-dashboard /></template>
          数据看板
        </a-menu-item>
        <a-sub-menu key="user">
          <template #icon><icon-user /></template>
          <template #title>用户管理</template>
          <a-menu-item key="/user/list">用户列表</a-menu-item>
          <a-menu-item key="/user/kyc">KYC审核</a-menu-item>
        </a-sub-menu>
        <a-sub-menu key="trade">
          <template #icon><icon-bar-chart /></template>
          <template #title>交易管理</template>
          <a-menu-item key="/system/symbols">品种管理</a-menu-item>
          <a-menu-item key="/trade/orders">订单列表</a-menu-item>
          <a-menu-item key="/trade/positions">持仓列表</a-menu-item>
        </a-sub-menu>
        <a-sub-menu key="fund">
          <template #icon><icon-storage /></template>
          <template #title>资金管理</template>
          <a-menu-item key="/fund/deposit">入金管理</a-menu-item>
          <a-menu-item key="/fund/withdraw">出金管理</a-menu-item>
          <a-menu-item key="/fund/flows">资金流水</a-menu-item>
          <a-menu-item key="/fund/statistics">财务统计</a-menu-item>
        </a-sub-menu>
        <a-sub-menu key="report">
          <template #icon><icon-file /></template>
          <template #title>报表统计</template>
          <a-menu-item key="/report/operation">运营报表</a-menu-item>
          <a-menu-item key="/report/risk">风控报表</a-menu-item>
          <a-menu-item key="/report/user-analysis">用户分析</a-menu-item>
        </a-sub-menu>
        <a-sub-menu key="risk">
          <template #icon><icon-safe /></template>
          <template #title>风控管理</template>
          <a-menu-item key="/risk/config">风控参数</a-menu-item>
          <a-menu-item key="/risk/alerts">风险预警</a-menu-item>
          <a-menu-item key="/risk/force-close">强平记录</a-menu-item>
          <a-menu-item key="/risk/aml">反洗钱</a-menu-item>
        </a-sub-menu>
        <a-sub-menu key="content">
          <template #icon><icon-book /></template>
          <template #title>内容管理</template>
          <a-menu-item key="/content/announcements">公告管理</a-menu-item>
          <a-menu-item key="/content/help">帮助文档</a-menu-item>
          <a-menu-item key="/content/activities">活动管理</a-menu-item>
          <a-menu-item key="/content/banners">Banner管理</a-menu-item>
          <a-menu-item key="/content/reward-cards">奖励卡片</a-menu-item>
        </a-sub-menu>
        <a-menu-item key="/chat">
          <template #icon><icon-message /></template>
          客服管理
        </a-menu-item>
        <a-sub-menu key="system">
          <template #icon><icon-settings /></template>
          <template #title>系统管理</template>
          <a-menu-item key="/system/roles">角色管理</a-menu-item>
          <a-menu-item key="/system/admins">管理员管理</a-menu-item>
          <a-menu-item key="/system/config">系统配置</a-menu-item>
          <a-menu-item key="/system/smtp">SMTP配置</a-menu-item>
          <a-menu-item key="/system/integration">第三方接口</a-menu-item>
          <a-menu-item key="/system/splash">启动屏广告</a-menu-item>
          <a-menu-item key="/system/logs">操作日志</a-menu-item>
        </a-sub-menu>
      </a-menu>
    </a-layout-sider>

    <a-layout>
      <a-layout-header class="header">
        <div class="header-right">
          <span class="admin-name">{{ authStore.adminInfo?.realName }}</span>
          <a-button type="text" size="small" @click="handleLogout">退出</a-button>
        </div>
      </a-layout-header>
      <a-layout-content class="content">
        <router-view />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup lang="ts">
/**
 * 管理后台默认布局
 * 左侧导航栏 + 顶部信息栏 + 内容区域
 */
import { computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../store/useAuthStore';
import {
  IconDashboard,
  IconUser,
  IconSettings,
  IconBarChart,
  IconStorage,
  IconSafe,
  IconFile,
  IconBook,
  IconMessage,
} from '@arco-design/web-vue/es/icon';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const selectedKeys = computed(() => [route.path]);

function handleMenuClick(key: string) {
  router.push(key);
}

function handleLogout() {
  authStore.logout();
  router.push('/login');
}

onMounted(() => {
  if (authStore.isLoggedIn && !authStore.adminInfo) {
    authStore.fetchProfile().catch(() => {
      authStore.logout();
      router.push('/login');
    });
  }
});
</script>

<style scoped>
.layout {
  height: 100vh;
}
.sider {
  background: #001529;
}
.logo {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
.logo-text {
  color: #fff;
  font-size: 18px;
  font-weight: bold;
}
.header {
  background: #fff;
  padding: 0 24px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}
.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.admin-name {
  font-size: 14px;
  color: #333;
}
.content {
  padding: 24px;
  background: #f0f2f5;
  overflow-y: auto;
}
</style>
