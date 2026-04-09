<template>
  <view class="alert-add-page">
    <NavBar title="新增预警" :show-back="true" />
    <view class="form-container">
      <view class="input-group">
        <text class="input-label">品种</text>
        <picker :range="symbolNames" @change="onSymbolChange">
          <view class="input-field picker-field">{{ selectedSymbolName || '请选择品种' }}</view>
        </picker>
      </view>
      <view class="input-group">
        <text class="input-label">预警类型</text>
        <picker :range="typeLabels" @change="onTypeChange">
          <view class="input-field picker-field">{{ selectedTypeLabel || '请选择类型' }}</view>
        </picker>
      </view>
      <view class="input-group">
        <text class="input-label">目标值</text>
        <input v-model="targetValue" class="input-field" placeholder="请输入目标价格/百分比" type="digit" />
      </view>
      <button class="submit-btn" @click="handleSubmit">确认添加</button>
    </view>
  </view>
</template>

<script setup lang="ts">
/**
 * 新增预警页面
 */
import { ref, onMounted } from 'vue';
import NavBar from '../../components/NavBar.vue';
import { get, post } from '../../utils/request';

const symbols = ref<{ id: number; name: string }[]>([]);
const symbolNames = ref<string[]>([]);
const selectedSymbolId = ref(0);
const selectedSymbolName = ref('');
const typeLabels = ['价格高于', '价格低于', '涨跌幅超'];
const typeValues = ['price_above', 'price_below', 'change_percent'];
const selectedType = ref('');
const selectedTypeLabel = ref('');
const targetValue = ref('');

async function fetchSymbols() {
  const list = await get<{ id: number; symbol: string; name: string }[]>('/api/mobile/market/symbols');
  symbols.value = list.map((s) => ({ id: s.id, name: s.name }));
  symbolNames.value = list.map((s) => s.name);
}

function onSymbolChange(e: { detail: { value: number } }) {
  const idx = e.detail.value;
  selectedSymbolId.value = symbols.value[idx].id;
  selectedSymbolName.value = symbols.value[idx].name;
}

function onTypeChange(e: { detail: { value: number } }) {
  const idx = e.detail.value;
  selectedType.value = typeValues[idx];
  selectedTypeLabel.value = typeLabels[idx];
}

async function handleSubmit() {
  if (!selectedSymbolId.value || !selectedType.value || !targetValue.value) {
    uni.showToast({ title: '请填写完整信息', icon: 'none' });
    return;
  }
  try {
    await post('/api/mobile/alert', {
      symbolId: selectedSymbolId.value,
      alertType: selectedType.value,
      targetValue: parseFloat(targetValue.value),
    });
    uni.showToast({ title: '预警已添加', icon: 'success' });
    setTimeout(() => uni.navigateBack(), 1000);
  } catch { /* handled */ }
}

onMounted(() => fetchSymbols());
</script>

<style scoped>
.alert-add-page { min-height: 100vh; background: #f0f4f8; }
.form-container { padding: 20px 24px; }
.input-group { margin-bottom: 20px; }
.input-label { font-size: 14px; color: #333; font-weight: 500; margin-bottom: 8px; display: block; }
.input-field { width: 100%; height: 48px; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 0 16px; font-size: 15px; box-sizing: border-box; }
.picker-field { display: flex; align-items: center; color: #333; }
.submit-btn { width: 100%; height: 48px; background: #2563eb; color: #fff; font-size: 16px; font-weight: 600; border-radius: 8px; border: none; }
</style>
