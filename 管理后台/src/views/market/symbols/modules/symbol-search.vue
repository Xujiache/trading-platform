<template>
  <ElCard class="mb-4" shadow="never">
    <ElForm :model="modelValue" inline>
      <ElFormItem label="关键词">
        <ElInput v-model="modelValue.keyword" placeholder="品种代码/名称" clearable style="width: 180px" />
      </ElFormItem>
      <ElFormItem label="品类">
        <ElSelect v-model="modelValue.category" placeholder="全部" clearable style="width: 140px">
          <ElOption label="全部" value="" />
          <ElOption label="贵金属" value="precious_metal" />
          <ElOption label="能源" value="energy" />
          <ElOption label="外汇" value="forex" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="状态">
        <ElSelect v-model="modelValue.status" placeholder="全部" clearable style="width: 120px">
          <ElOption label="全部" value="" />
          <ElOption label="启用" value="active" />
          <ElOption label="禁用" value="inactive" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="行情源">
        <ElSelect v-model="modelValue.price_source" placeholder="全部" clearable style="width: 140px">
          <ElOption label="全部" value="" />
          <ElOption label="real 真实" value="real" />
          <ElOption label="custom 自控" value="custom" />
          <ElOption label="hybrid 混合" value="hybrid" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem>
        <ElButton type="primary" @click="$emit('search', modelValue)">搜索</ElButton>
        <ElButton @click="$emit('reset')">重置</ElButton>
      </ElFormItem>
    </ElForm>
  </ElCard>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: Record<string, any>
}>()

defineEmits<{
  search: [params: Record<string, any>]
  reset: []
  'update:modelValue': [value: Record<string, any>]
}>()
</script>
