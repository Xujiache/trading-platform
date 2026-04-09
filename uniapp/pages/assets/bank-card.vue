<template>
  <view class="bank-card-page">
    <NavBar title="银行卡管理" :show-back="true" />
    <view v-if="cards.length" class="card-list">
      <view v-for="card in cards" :key="card.id" class="card-item">
        <view class="card-info">
          <text class="card-bank">{{ card.bankName }}</text>
          <text class="card-number">{{ card.cardNumber }}</text>
        </view>
        <text class="delete-btn" @click="handleDelete(card.id)">删除</text>
      </view>
    </view>
    <Empty v-else text="暂无银行卡" />
    <view class="add-section">
      <button class="add-btn" @click="showAdd = true">+ 添加银行卡</button>
    </view>

    <view v-if="showAdd" class="modal-overlay" @click.self="showAdd = false">
      <view class="modal-content">
        <text class="modal-title">添加银行卡</text>
        <input v-model="form.bankName" class="modal-input" placeholder="银行名称" />
        <input v-model="form.cardNumber" class="modal-input" placeholder="银行卡号" type="number" />
        <input v-model="form.holderName" class="modal-input" placeholder="持卡人姓名（须与实名一致）" />
        <button class="modal-btn" @click="handleAdd">确认添加</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import NavBar from '../../components/NavBar.vue';
import Empty from '../../components/Empty.vue';
import { get, post, del } from '../../utils/request';

const cards = ref<Record<string, unknown>[]>([]);
const showAdd = ref(false);
const form = reactive({ bankName: '', cardNumber: '', holderName: '' });

async function fetchCards() {
  try { cards.value = await get('/api/mobile/fund/bank-cards'); } catch { /* handled */ }
}

async function handleAdd() {
  if (!form.bankName || !form.cardNumber || !form.holderName) {
    uni.showToast({ title: '请填写完整信息', icon: 'none' }); return;
  }
  try {
    await post('/api/mobile/fund/bank-cards', form);
    uni.showToast({ title: '添加成功', icon: 'success' });
    showAdd.value = false;
    form.bankName = ''; form.cardNumber = ''; form.holderName = '';
    fetchCards();
  } catch { /* handled */ }
}

async function handleDelete(id: number) {
  try { await del(`/api/mobile/fund/bank-cards/${id}`); fetchCards(); } catch { /* handled */ }
}

onMounted(() => fetchCards());
</script>

<style scoped>
.bank-card-page { min-height: 100vh; background: #f0f4f8; }
.card-list { padding: 12px 16px; }
.card-item { display: flex; justify-content: space-between; align-items: center; background: #fff; border-radius: 8px; padding: 16px; margin-bottom: 8px; }
.card-bank { font-size: 15px; font-weight: 600; color: #1a1a1a; display: block; }
.card-number { font-size: 14px; color: #666; margin-top: 4px; display: block; font-family: 'SF Mono', monospace; }
.delete-btn { color: #ef4444; font-size: 14px; }
.add-section { padding: 20px 16px; }
.add-btn { width: 100%; height: 48px; background: #2563eb; color: #fff; font-size: 16px; font-weight: 600; border-radius: 8px; border: none; }
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-content { width: 85%; background: #fff; border-radius: 12px; padding: 24px; }
.modal-title { font-size: 18px; font-weight: 600; color: #1a1a1a; margin-bottom: 16px; display: block; }
.modal-input { width: 100%; height: 44px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 0 12px; margin-bottom: 12px; font-size: 14px; box-sizing: border-box; }
.modal-btn { width: 100%; height: 44px; background: #2563eb; color: #fff; border-radius: 8px; border: none; font-size: 15px; font-weight: 600; }
</style>
