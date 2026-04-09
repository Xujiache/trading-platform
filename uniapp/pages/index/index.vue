<template>
  <view class="home-page">
    <view class="home-header">
      <view class="header-top">
        <text class="app-title">寰球汇金交易所</text>
        <view class="header-actions">
          <text class="action-icon" @click="goMessages">消息</text>
        </view>
      </view>

      <view v-if="account" class="account-overview">
        <text class="overview-label">账户净值</text>
        <text class="overview-amount">¥{{ account.equity || '0.00' }}</text>
        <view class="overview-row">
          <view class="overview-item">
            <text class="item-label">可用</text>
            <text class="item-value">{{ account.availableMargin || '0.00' }}</text>
          </view>
          <view class="overview-item">
            <text class="item-label">浮盈</text>
            <text class="item-value" :class="parseFloat(account.floatingPnl || '0') >= 0 ? 'up' : 'down'">{{ account.floatingPnl || '0.00' }}</text>
          </view>
        </view>
      </view>
    </view>

    <view class="home-content">
      <view class="section">
        <view class="section-header">
          <text class="section-title">热门行情</text>
          <text class="section-more" @click="goMarket">更多</text>
        </view>
        <view class="symbol-list">
          <view v-for="item in hotSymbols" :key="item.symbol" class="symbol-item" @click="goSymbolDetail(item)">
            <view class="symbol-info">
              <text class="symbol-name">{{ item.name }}</text>
              <text class="symbol-code">{{ item.symbol }}</text>
            </view>
            <text class="symbol-price" :class="priceClass(item)">{{ item.price?.last || '--' }}</text>
            <view class="change-badge" :class="changeClass(item)">
              <text class="change-text">{{ formatChange(item) }}</text>
            </view>
          </view>
        </view>
      </view>

      <view v-if="announcements.length" class="section">
        <view class="section-header">
          <text class="section-title">最新公告</text>
        </view>
        <view class="announcement-list">
          <view v-for="item in announcements" :key="item.id" class="announcement-item">
            <text class="announcement-tag">公告</text>
            <text class="announcement-title">{{ item.title }}</text>
          </view>
        </view>
      </view>

      <view class="section">
        <view class="section-header">
          <text class="section-title">常用功能</text>
        </view>
        <view class="quick-actions">
          <view class="quick-item" @click="goDeposit"><text class="quick-icon">入</text><text class="quick-label">入金</text></view>
          <view class="quick-item" @click="goWithdraw"><text class="quick-icon">出</text><text class="quick-label">出金</text></view>
          <view class="quick-item" @click="goTrade"><text class="quick-icon">交</text><text class="quick-label">交易</text></view>
          <view class="quick-item" @click="goHelp"><text class="quick-icon">帮</text><text class="quick-label">帮助</text></view>
        </view>
      </view>

      <view class="trust-bar">
        <text class="trust-text">寰球汇金 · 安全可靠 · 全球贵金属原油交易</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
/**
 * 首页（TabBar 页面）
 * 展示账户概览、热门行情、最新公告、常用功能入口
 */
import { ref, onMounted, onUnmounted } from 'vue';
import { get } from '../../utils/request';

const hotSymbols = ref<Record<string, unknown>[]>([]);
const announcements = ref<Record<string, unknown>[]>([]);
const account = ref<Record<string, string> | null>(null);
let pollTimer: ReturnType<typeof setInterval> | null = null;

async function fetchData() {
  try {
    const [symbols, anncs] = await Promise.all([
      get<Record<string, unknown>[]>('/api/mobile/homepage/hot-symbols'),
      get<Record<string, unknown>[]>('/api/mobile/homepage/announcements'),
    ]);
    hotSymbols.value = symbols;
    announcements.value = anncs;
  } catch {}

  const token = uni.getStorageSync('accessToken');
  if (token) {
    try { account.value = await get('/api/mobile/trade/account'); } catch {}
  }
}

function priceClass(item: Record<string, unknown>) {
  const p = item.price as Record<string, string> | null;
  if (!p) return '';
  return parseFloat(p.change) >= 0 ? 'up' : 'down';
}

function changeClass(item: Record<string, unknown>) {
  const p = item.price as Record<string, string> | null;
  if (!p) return '';
  return parseFloat(p.change) >= 0 ? 'badge-up' : 'badge-down';
}

function formatChange(item: Record<string, unknown>) {
  const p = item.price as Record<string, string> | null;
  if (!p) return '--';
  const prefix = parseFloat(p.changePercent) >= 0 ? '+' : '';
  return `${prefix}${p.changePercent}%`;
}

function goMessages() { uni.navigateTo({ url: '/pages/mine/messages' }); }
function goMarket() { uni.switchTab({ url: '/pages/market/index' }); }
function goSymbolDetail(item: Record<string, unknown>) { uni.navigateTo({ url: `/pages/market/detail?id=${item.id}` }); }
function goDeposit() { uni.navigateTo({ url: '/pages/assets/deposit' }); }
function goWithdraw() { uni.navigateTo({ url: '/pages/assets/withdraw' }); }
function goTrade() { uni.switchTab({ url: '/pages/trade/index' }); }
function goHelp() { uni.navigateTo({ url: '/pages/mine/help' }); }

onMounted(() => { fetchData(); pollTimer = setInterval(fetchData, 5000); });
onUnmounted(() => { if (pollTimer) clearInterval(pollTimer); });
</script>

<style scoped>
.home-page { min-height: 100vh; background: #f0f4f8; }
.home-header { padding: 50px 24px 24px; background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); }
.header-top { display: flex; justify-content: space-between; align-items: center; }
.app-title { font-size: 20px; font-weight: bold; color: #fff; }
.action-icon { font-size: 14px; color: rgba(255,255,255,0.8); }
.account-overview { margin-top: 20px; background: rgba(255,255,255,0.1); border-radius: 12px; padding: 16px 20px; }
.overview-label { font-size: 12px; color: rgba(255,255,255,0.6); display: block; }
.overview-amount { font-size: 28px; font-weight: bold; color: #fff; font-family: 'SF Mono', monospace; display: block; margin-top: 4px; }
.overview-row { display: flex; gap: 24px; margin-top: 12px; }
.overview-item { }
.item-label { font-size: 12px; color: rgba(255,255,255,0.5); display: block; }
.item-value { font-size: 15px; color: #fff; font-weight: 500; display: block; margin-top: 2px; }
.up { color: #34d399 !important; }
.down { color: #fca5a5 !important; }
.home-content { padding: 16px; }
.section { margin-bottom: 20px; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.section-title { font-size: 16px; font-weight: 600; color: #1a1a1a; }
.section-more { font-size: 13px; color: #2563eb; }
.symbol-list { background: #fff; border-radius: 12px; overflow: hidden; }
.symbol-item { display: flex; align-items: center; padding: 14px 16px; border-bottom: 1px solid #f3f4f6; }
.symbol-item:last-child { border-bottom: none; }
.symbol-info { flex: 1; }
.symbol-name { font-size: 15px; font-weight: 600; color: #1a1a1a; display: block; }
.symbol-code { font-size: 11px; color: #999; margin-top: 2px; display: block; }
.symbol-price { flex: 0 0 auto; font-size: 17px; font-weight: bold; font-family: 'SF Mono', monospace; margin-right: 12px; }
.change-badge { padding: 4px 10px; border-radius: 4px; }
.badge-up { background: rgba(16,185,129,0.1); }
.badge-down { background: rgba(239,68,68,0.1); }
.change-text { font-size: 13px; font-weight: 600; font-family: 'SF Mono', monospace; }
.badge-up .change-text { color: #10b981; }
.badge-down .change-text { color: #ef4444; }
.announcement-list { background: #fff; border-radius: 12px; overflow: hidden; }
.announcement-item { display: flex; align-items: center; padding: 12px 16px; border-bottom: 1px solid #f3f4f6; gap: 8px; }
.announcement-item:last-child { border-bottom: none; }
.announcement-tag { font-size: 11px; color: #2563eb; background: rgba(37,99,235,0.08); padding: 2px 6px; border-radius: 3px; font-weight: 500; }
.announcement-title { font-size: 14px; color: #333; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.quick-actions { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.quick-item { background: #fff; border-radius: 10px; padding: 16px 0; text-align: center; }
.quick-icon { width: 36px; height: 36px; border-radius: 50%; background: rgba(37,99,235,0.08); color: #2563eb; font-size: 14px; font-weight: bold; display: flex; align-items: center; justify-content: center; margin: 0 auto 8px; line-height: 36px; }
.quick-label { font-size: 12px; color: #666; display: block; }
.trust-bar { text-align: center; padding: 20px; }
.trust-text { font-size: 12px; color: #bbb; }
</style>
