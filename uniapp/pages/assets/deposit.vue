<template>
  <view class="deposit-page">
    <NavBar title="入金" :show-back="true" />
    <view class="form-container">
      <view class="input-group">
        <text class="input-label">入金金额</text>
        <input v-model="amount" class="input-field" type="digit" placeholder="最低入金 100 元" />
      </view>
      <view class="input-group">
        <text class="input-label">支付方式</text>
        <picker :range="payMethods" @change="onMethodChange">
          <view class="input-field picker-field">{{ selectedMethod || '请选择支付方式' }}</view>
        </picker>
      </view>
      <button class="submit-btn" :disabled="loading" @click="handleSubmit">{{ loading ? '提交中...' : '提交入金申请' }}</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import NavBar from '../../components/NavBar.vue';
import { post } from '../../utils/request';

const amount = ref('');
const selectedMethod = ref('');
const payMethods = ['银行转账', 'USDT'];
const payMethodValues = ['bank_transfer', 'usdt'];
const loading = ref(false);

function onMethodChange(e: { detail: { value: number } }) { selectedMethod.value = payMethods[e.detail.value]; }

async function handleSubmit() {
  if (!amount.value || parseFloat(amount.value) < 100) { uni.showToast({ title: '最低入金 100 元', icon: 'none' }); return; }
  if (!selectedMethod.value) { uni.showToast({ title: '请选择支付方式', icon: 'none' }); return; }
  loading.value = true;
  try {
    const idx = payMethods.indexOf(selectedMethod.value);
    await post('/api/mobile/fund/deposit', { amount: parseFloat(amount.value), paymentMethod: payMethodValues[idx] });
    uni.showToast({ title: '入金申请已提交', icon: 'success' });
    setTimeout(() => uni.navigateBack(), 1000);
  } catch { /* handled */ } finally { loading.value = false; }
}
</script>

<style scoped>
.deposit-page { min-height: 100vh; background: #f0f4f8; }
.form-container { padding: 20px 24px; }
.input-group { margin-bottom: 20px; }
.input-label { font-size: 14px; color: #333; font-weight: 500; margin-bottom: 8px; display: block; }
.input-field { width: 100%; height: 48px; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 0 16px; font-size: 15px; box-sizing: border-box; }
.picker-field { display: flex; align-items: center; }
.submit-btn { width: 100%; height: 48px; background: #10b981; color: #fff; font-size: 16px; font-weight: 600; border-radius: 8px; border: none; }
.submit-btn[disabled] { opacity: 0.6; }
</style>
