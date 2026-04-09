<template>
  <view class="kyc-page">
    <NavBar title="实名认证" :show-back="true" />

    <view class="form-container">
      <view class="input-group">
        <text class="input-label">真实姓名</text>
        <input v-model="form.realName" class="input-field" placeholder="请输入身份证上的姓名" />
      </view>

      <view class="input-group">
        <text class="input-label">身份证号</text>
        <input v-model="form.idCard" class="input-field" placeholder="请输入18位身份证号码" />
      </view>

      <view class="input-group">
        <text class="input-label">身份证正面照</text>
        <view class="upload-area" @click="chooseImage('front')">
          <text class="upload-text">{{ form.idCardFront ? '已上传' : '点击上传正面照' }}</text>
        </view>
      </view>

      <view class="input-group">
        <text class="input-label">身份证反面照</text>
        <view class="upload-area" @click="chooseImage('back')">
          <text class="upload-text">{{ form.idCardBack ? '已上传' : '点击上传反面照' }}</text>
        </view>
      </view>

      <button class="submit-btn" :disabled="loading" @click="handleSubmit">
        {{ loading ? '提交中...' : '提交认证' }}
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
/**
 * KYC 实名认证页面
 * 提交真实姓名、身份证号和身份证照片
 */
import { ref, reactive } from 'vue';
import NavBar from '../../components/NavBar.vue';
import { post } from '../../utils/request';

const loading = ref(false);
const form = reactive({
  realName: '',
  idCard: '',
  idCardFront: '',
  idCardBack: '',
});

function chooseImage(side: 'front' | 'back') {
  uni.chooseImage({
    count: 1,
    success: (res) => {
      if (side === 'front') {
        form.idCardFront = res.tempFilePaths[0];
      } else {
        form.idCardBack = res.tempFilePaths[0];
      }
    },
  });
}

async function handleSubmit() {
  if (!form.realName || !form.idCard || !form.idCardFront || !form.idCardBack) {
    uni.showToast({ title: '请填写完整信息并上传照片', icon: 'none' });
    return;
  }
  loading.value = true;
  try {
    await post('/api/mobile/user/kyc', form);
    uni.showToast({ title: '提交成功，请等待审核', icon: 'success' });
    setTimeout(() => uni.navigateBack(), 1500);
  } catch (err: unknown) {
    const error = err as Error;
    uni.showToast({ title: error.message || '提交失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.kyc-page { min-height: 100vh; background: #f0f4f8; }
.form-container { padding: 20px 24px; }
.input-group { margin-bottom: 20px; }
.input-label { font-size: 14px; color: #333; font-weight: 500; margin-bottom: 8px; display: block; }
.input-field { width: 100%; height: 48px; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 0 16px; font-size: 15px; box-sizing: border-box; }
.upload-area { height: 100px; background: #fff; border: 2px dashed #e5e7eb; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
.upload-text { font-size: 14px; color: #999; }
.submit-btn { width: 100%; height: 48px; background: #2563eb; color: #fff; font-size: 16px; font-weight: 600; border-radius: 8px; border: none; margin-top: 8px; }
.submit-btn[disabled] { opacity: 0.6; }
</style>
