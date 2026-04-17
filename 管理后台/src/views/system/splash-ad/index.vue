<template>
  <div class="art-full-height">
    <ElCard shadow="never" header="开屏广告配置">
      <ElForm :model="form" label-width="120px" v-loading="loading" style="max-width: 700px">
        <ElFormItem label="是否启用">
          <ElSwitch v-model="form.enabled" />
        </ElFormItem>
        <ElFormItem label="展示时长(秒)">
          <ElInputNumber v-model="form.duration" :min="1" :max="10" />
        </ElFormItem>
        <ElFormItem label="背景图片">
          <div v-if="form.imageUrl" class="mb-2">
            <ElImage :src="form.imageUrl" style="width: 200px; height: 350px" fit="contain" />
            <div class="mt-1">
              <ElButton size="small" type="danger" @click="form.imageUrl = ''">删除图片</ElButton>
            </div>
          </div>
          <ElUpload
            action="/api/admin/upload/image"
            :show-file-list="false"
            :on-success="handleUploadSuccess"
            :headers="uploadHeaders"
            accept="image/*"
          >
            <ElButton size="small" type="primary">上传图片</ElButton>
          </ElUpload>
        </ElFormItem>
        <ElFormItem label="跳转链接">
          <ElInput v-model="form.linkUrl" placeholder="外部链接或内部页面路径（可空）" />
        </ElFormItem>
        <ElFormItem label="富文本内容">
          <ElInput v-model="form.richText" type="textarea" :rows="6" placeholder="当无图片时展示此富文本" />
        </ElFormItem>
        <ElFormItem>
          <ElButton type="primary" @click="saveConfig" :loading="saving">保存配置</ElButton>
        </ElFormItem>
      </ElForm>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { fetchConfigList, updateConfig, type ConfigItem } from '@/api/admin-config'
import { useUserStore } from '@/store/modules/user'
import { ElMessage } from 'element-plus'

defineOptions({ name: 'SplashAd' })

const form = ref({
  enabled: false,
  duration: 3,
  imageUrl: '',
  linkUrl: '',
  richText: '',
})
const loading = ref(false)
const saving = ref(false)
const configMap = ref<Record<string, ConfigItem>>({})
const uploadHeaders = computed(() => {
  const { accessToken } = useUserStore()
  return { Authorization: accessToken }
})

const splashKeys = [
  'splash_enabled', 'splash_duration', 'splash_image_url',
  'splash_link_url', 'splash_rich_text'
]

async function loadConfig() {
  loading.value = true
  try {
    const res = await fetchConfigList({ category: 'system' })
    if (res) {
      res.forEach((item: ConfigItem) => {
        configMap.value[item.config_key] = item
      })
      form.value.enabled = configMap.value['splash_enabled']?.config_value === 'true'
      form.value.duration = parseInt(configMap.value['splash_duration']?.config_value) || 3
      form.value.imageUrl = configMap.value['splash_image_url']?.config_value || ''
      form.value.linkUrl = configMap.value['splash_link_url']?.config_value || ''
      form.value.richText = configMap.value['splash_rich_text']?.config_value || ''
    }
  } catch {} finally {
    loading.value = false
  }
}

async function saveConfig() {
  saving.value = true
  try {
    const updates: Record<string, string> = {
      splash_enabled: String(form.value.enabled),
      splash_duration: String(form.value.duration),
      splash_image_url: form.value.imageUrl,
      splash_link_url: form.value.linkUrl,
      splash_rich_text: form.value.richText,
    }
    for (const [key, value] of Object.entries(updates)) {
      const cfg = configMap.value[key]
      if (cfg) {
        await updateConfig(cfg.id, { config_value: value })
      }
    }
    ElMessage.success('开屏广告配置保存成功')
  } catch {} finally {
    saving.value = false
  }
}

function handleUploadSuccess(response: any) {
  if (response?.data?.url) {
    form.value.imageUrl = response.data.url
  }
}

onMounted(() => {
  loadConfig()
})
</script>
