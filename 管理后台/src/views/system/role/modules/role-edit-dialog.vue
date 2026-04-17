<template>
  <ElDialog
    v-model="visible"
    :title="dialogType === 'add' ? '新增角色' : '编辑角色'"
    width="500px"
    align-center
    @close="handleClose"
  >
    <ElForm ref="formRef" :model="form" :rules="rules" label-width="100px">
      <ElFormItem label="角色标识" prop="name">
        <ElInput v-model="form.name" placeholder="如: operator" :disabled="dialogType === 'edit'" />
      </ElFormItem>
      <ElFormItem label="显示名称" prop="display_name">
        <ElInput v-model="form.display_name" placeholder="请输入显示名称" />
      </ElFormItem>
      <ElFormItem label="描述" prop="description">
        <ElInput v-model="form.description" type="textarea" :rows="3" placeholder="请输入角色描述" />
      </ElFormItem>
      <ElFormItem label="状态">
        <ElSwitch v-model="form.statusBool" active-text="启用" inactive-text="禁用" />
      </ElFormItem>
      <ElFormItem label="排序">
        <ElInputNumber v-model="form.sort_order" :min="0" :max="999" />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton @click="handleClose">取消</ElButton>
      <ElButton type="primary" @click="handleSubmit" :loading="submitting">提交</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { createRole, updateRole, type RoleItem } from '@/api/admin-role'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'

interface Props {
  modelValue: boolean
  dialogType: 'add' | 'edit'
  roleData?: RoleItem
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  dialogType: 'add',
  roleData: undefined,
})

const emit = defineEmits<Emits>()
const formRef = ref<FormInstance>()
const submitting = ref(false)

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const rules = reactive<FormRules>({
  name: [
    { required: true, message: '请输入角色标识', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' },
  ],
  display_name: [
    { required: true, message: '请输入显示名称', trigger: 'blur' },
    { min: 2, max: 100, message: '长度在 2 到 100 个字符', trigger: 'blur' },
  ],
})

const form = reactive({
  id: 0,
  name: '',
  display_name: '',
  description: '',
  statusBool: true,
  sort_order: 0,
})

watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) initForm()
  }
)

function initForm() {
  if (props.dialogType === 'edit' && props.roleData) {
    form.id = props.roleData.id
    form.name = props.roleData.name
    form.display_name = props.roleData.display_name
    form.description = props.roleData.description
    form.statusBool = props.roleData.status === 1
    form.sort_order = props.roleData.sort_order
  } else {
    form.id = 0
    form.name = ''
    form.display_name = ''
    form.description = ''
    form.statusBool = true
    form.sort_order = 0
  }
}

function handleClose() {
  visible.value = false
  formRef.value?.resetFields()
}

async function handleSubmit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    submitting.value = true

    const params = {
      name: form.name,
      display_name: form.display_name,
      description: form.description,
      status: form.statusBool ? 1 : 0,
      sort_order: form.sort_order,
    }

    if (props.dialogType === 'add') {
      await createRole(params)
      ElMessage.success('角色创建成功')
    } else {
      await updateRole(form.id, params)
      ElMessage.success('角色更新成功')
    }

    emit('success')
    handleClose()
  } catch (error) {
    console.error('提交失败:', error)
  } finally {
    submitting.value = false
  }
}
</script>
