<template>
  <view class="assets-page">
    <view class="assets-header">
      <text class="header-label">总资产 (CNY)</text>
      <text class="header-amount">¥{{ overview.balance }}</text>
      <view class="header-stats">
        <view class="stat"><text class="stat-label">冻结</text><text class="stat-value">{{ overview.frozenBalance }}</text></view>
        <view class="stat"><text class="stat-label">已用保证金</text><text class="stat-value">{{ overview.usedMargin }}</text></view>
        <view class="stat"><text class="stat-label">累计盈亏</text><text class="stat-value">{{ overview.totalPnl }}</text></view>
      </view>
    </view>

    <view class="action-row">
      <button class="action-btn deposit-btn" @click="navigate('/pages/assets/deposit')">入金</button>
      <button class="action-btn withdraw-btn" @click="navigate('/pages/assets/withdraw')">出金</button>
    </view>

    <view class="menu-list">
      <view class="menu-item" @click="navigate('/pages/assets/deposit-records')"><text class="menu-text">入金记录</text><text class="menu-arrow">›</text></view>
      <view class="menu-item" @click="navigate('/pages/assets/withdraw-records')"><text class="menu-text">出金记录</text><text class="menu-arrow">›</text></view>
      <view class="menu-item" @click="navigate('/pages/assets/flows')"><text class="menu-text">资金流水</text><text class="menu-arrow">›</text></view>
      <view class="menu-item" @click="navigate('/pages/assets/bank-card')"><text class="menu-text">银行卡管理</text><text class="menu-arrow">›</text></view>
    </view>
  </view>
</template>

<script setup lang="ts">
/**
 * 资产页（TabBar 页面）
 * 展示资产总览、入金出金入口
 */
import { ref, onMounted } from 'vue';
import { get } from '../../utils/request';

const overview = ref({ balance: '0.00', frozenBalance: '0.00', usedMargin: '0.00', totalPnl: '0.00' });

async function fetchOverview() {
  try { overview.value = await get('/api/mobile/fund/overview'); } catch { /* handled */ }
}

function navigate(url: string) { uni.navigateTo({ url }); }

onMounted(() => fetchOverview());
</script>

<style scoped>
.assets-page { min-height: 100vh; background: #f0f4f8; }
.assets-header { padding: 60px 24px 24px; background: linear-gradient(135deg, #1e40af, #2563eb); }
.header-label { font-size: 14px; color: rgba(255,255,255,0.7); display: block; }
.header-amount { font-size: 32px; font-weight: bold; color: #fff; font-family: 'SF Mono', monospace; display: block; margin-top: 8px; }
.header-stats { display: flex; margin-top: 16px; }
.stat { flex: 1; }
.stat-label { font-size: 12px; color: rgba(255,255,255,0.6); display: block; }
.stat-value { font-size: 14px; color: #fff; font-weight: 500; display: block; margin-top: 2px; }
.action-row { display: flex; gap: 12px; padding: 16px; }
.action-btn { flex: 1; height: 44px; border-radius: 8px; font-size: 15px; font-weight: 600; border: none; color: #fff; }
.deposit-btn { background: #10b981; }
.withdraw-btn { background: #2563eb; }
.menu-list { margin: 0 16px; background: #fff; border-radius: 12px; overflow: hidden; }
.menu-item { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #f3f4f6; }
.menu-item:last-child { border-bottom: none; }
.menu-text { font-size: 15px; color: #1a1a1a; }
.menu-arrow { font-size: 20px; color: #ccc; }
</style>
