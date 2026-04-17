<template>
  <div class="splash-ad-page art-full-height">
    <ElCard shadow="never">
      <div class="table-header flex-between mb-4">
        <span class="font-bold">开屏广告配置</span>
        <ElButton :icon="Refresh" circle @click="loadData" />
      </div>

      <ElForm :model="form" label-width="120px" v-loading="loading" style="max-width: 600px">
        <ElFormItem label="启用开屏广告">
          <ElSwitch v-model="form.splash_enabled" active-value="true" inactive-value="false" />
        </ElFormItem>
        <ElFormItem label="展示时长(秒)">
          <ElInputNumber v-model="form.splash_duration" :min="1" :max="15" />
        </ElFormItem>
        <ElFormItem label="广告图片">
          <div class="upload-area">
            <ElUpload :action="uploadUrl" :headers="uploadHeaders" :show-file-list="false"
              :on-success="onImageUpload" accept="image/*">
              <ElButton type="primary" size="small">上传图片</ElButton>
            </ElUpload>
            <ElInput v-model="form.splash_image_url" placeholder="或直接输入图片URL" class="mt-2" />
            <div v-if="form.splash_image_url" class="preview-box mt-2">
              <ElImage :src="form.splash_image_url" style="max-width: 200px; max-height: 300px" fit="contain" />
            </div>
          </div>
        </ElFormItem>
        <ElFormItem label="跳转链接">
          <ElInput v-model="form.splash_link_url" placeholder="点击广告跳转的URL（选填）" />
        </ElFormItem>
        <ElFormItem label="富文本内容">
          <ElInput v-model="form.splash_rich_text" type="textarea" :rows="6" placeholder="开屏广告富文本内容（选填，优先级低于图片）" />
        </ElFormItem>
        <ElFormItem>
          <ElButton type="primary" @click="handleSave" :loading="saving">保存配置</ElButton>
        </ElFormItem>
      </ElForm>
    </ElCard>

    <ElCard shadow="never" class="mt-4">
      <div class="font-bold mb-4">预览效果</div>
      <div class="preview-phone">
        <div class="preview-screen" v-if="form.splash_enabled === 'true'">
          <div class="preview-skip">{{ form.splash_duration }}s 跳过</div>
          <ElImage v-if="form.splash_image_url" :src="form.splash_image_url" fit="cover" class="preview-image" />
          <div v-else-if="form.splash_rich_text" class="preview-rich" v-html="form.splash_rich_text"></div>
          <div v-else class="preview-empty">未配置广告内容</div>
        </div>
        <div class="preview-screen preview-disabled" v-else>
          <div class="preview-empty">开屏广告已关闭</div>
        </div>
      </div>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import { fetchSplashAdConfig, saveSplashAdConfig } from '@/api/admin-operation'
import { useUserStore } from '@/store/modules/user'

const loading = ref(false)
const saving = ref(false)

const uploadUrl = '/api/admin/upload/image'
const uploadHeaders = computed(() => {
  const { accessToken } = useUserStore()
  return { Authorization: accessToken }
})

const form = reactive({
  splash_enabled: 'false',
  splash_duration: 3,
  splash_image_url: '',
  splash_link_url: '',
  splash_rich_text: '',
})

async function loadData() {
  loading.value = true
  try {
    const d = await fetchSplashAdConfig()
    if (d) {
      form.splash_enabled = d.splash_enabled || 'false'
      form.splash_duration = parseInt(d.splash_duration) || 3
      form.splash_image_url = d.splash_image_url || ''
      form.splash_link_url = d.splash_link_url || ''
      form.splash_rich_text = d.splash_rich_text || ''
    }
  } finally { loading.value = false }
}

function onImageUpload(response: any) {
  if (response?.code === 200 && response?.data?.url) {
    form.splash_image_url = response.data.url
  }
}

async function handleSave() {
  saving.value = true
  try {
    await saveSplashAdConfig({
      splash_enabled: form.splash_enabled,
      splash_duration: String(form.splash_duration),
      splash_image_url: form.splash_image_url,
      splash_link_url: form.splash_link_url,
      splash_rich_text: form.splash_rich_text,
    })
  } finally { saving.value = false }
}

onMounted(() => loadData())
</script>

<style scoped>
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.upload-area { width: 100%; }
.preview-box { border: 1px dashed #ddd; padding: 8px; border-radius: 4px; display: inline-block; }
.preview-phone {
  width: 240px; height: 420px; border: 3px solid #333; border-radius: 24px;
  overflow: hidden; margin: 0 auto; background: #000;
}
.preview-screen {
  width: 100%; height: 100%; position: relative;
  display: flex; align-items: center; justify-content: center; background: #111;
}
.preview-skip {
  position: absolute; top: 12px; right: 12px;
  background: rgba(0,0,0,0.5); color: #fff; padding: 4px 12px;
  border-radius: 12px; font-size: 12px; z-index: 1;
}
.preview-image { width: 100%; height: 100%; object-fit: cover; }
.preview-rich { color: #fff; padding: 16px; font-size: 12px; overflow: auto; max-height: 100%; }
.preview-empty { color: #666; font-size: 14px; }
.preview-disabled { background: #222; }
</style>
