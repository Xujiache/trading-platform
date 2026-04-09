<template>
  <view class="withdraw-page">
    <NavBar title="出金" :show-back="true" />
    <view class="form-container">
      <view class="input-group">
        <text class="input-label">出金金额</text>
        <input v-model="amount" class="input-field" type="digit" placeholder="请输入出金金额" />
      </view>
      <view class="input-group">
        <text class="input-label">到账银行卡</text>
        <picker :range="cardNames" @change="onCardChange">
          <view class="input-field picker-field">{{ selectedCardName || '请选择银行卡' }}</view>
        </picker>
      </view>
      <button class="submit-btn" :disabled="loading" @click="handleSubmit">{{ loading ? '提交中...' : '提交出金申请' }}</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import NavBar from '../../components/NavBar.vue';
import { get, post } from '../../utils/request';

const amount = ref('');
const cards = ref<{ id: number; bankName: string; cardNumber: string }[]>([]);
const cardNames = ref<string[]>([]);
const selectedCardId = ref(0);
const selectedCardName = ref('');
const loading = ref(false);

function onCardChange(e: { detail: { value: number } }) {
  const idx = e.detail.value;
  selectedCardId.value = cards.value[idx].id;
  selectedCardName.value = cardNames.value[idx];
}

async function handleSubmit() {
  if (!amount.value || parseFloat(amount.value) <= 0) { uni.showToast({ title: '请输入出金金额', icon: 'none' }); return; }
  if (!selectedCardId.value) { uni.showToast({ title: '请选择银行卡', icon: 'none' }); return; }
  loading.value = true;
  try {
    await post('/api/mobile/fund/withdraw', { amount: parseFloat(amount.value), bankCardId: selectedCardId.value });
    uni.showToast({ title: '出金申请已提交', icon: 'success' });
    setTimeout(() => uni.navigateBack(), 1000);
  } catch { /* handled */ } finally { loading.value = false; }
}

onMounted(async () => {
  try {
    const list = await get<{ id: number; bankName: string; cardNumber: string }[]>('/api/mobile/fund/bank-cards');
    cards.value = list;
    cardNames.value = list.map((c) => `${c.bankName} ${c.cardNumber}`);
  } catch { /* handled */ }
});
</script>

<style scoped>
.withdraw-page { min-height: 100vh; background: #f0f4f8; }
.form-container { padding: 20px 24px; }
.input-group { margin-bottom: 20px; }
.input-label { font-size: 14px; color: #333; font-weight: 500; margin-bottom: 8px; display: block; }
.input-field { width: 100%; height: 48px; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 0 16px; font-size: 15px; box-sizing: border-box; }
.picker-field { display: flex; align-items: center; }
.submit-btn { width: 100%; height: 48px; background: #2563eb; color: #fff; font-size: 16px; font-weight: 600; border-radius: 8px; border: none; }
.submit-btn[disabled] { opacity: 0.6; }
</style>
