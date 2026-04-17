<template>
  <ElDialog v-model="visible" title="权限配置" width="500px" align-center @close="handleClose">
    <div v-if="roleData" class="mb-4">
      <span class="text-sm text-gray-500">角色: </span>
      <ElTag>{{ roleData.display_name }}</ElTag>
    </div>

    <ElCheckboxGroup v-model="checkedPermissions">
      <div v-for="group in permissionGroups" :key="group.label" class="mb-4">
        <div class="text-sm font-medium text-gray-700 mb-2">{{ group.label }}</div>
        <div class="flex flex-wrap gap-2">
          <ElCheckbox v-for="p in group.items" :key="p.value" :label="p.value" :value="p.value">
            {{ p.label }}
          </ElCheckbox>
        </div>
      </div>
    </ElCheckboxGroup>

    <template #footer>
      <ElButton @click="selectAll">{{ isAllSelected ? '取消全选' : '全选' }}</ElButton>
      <ElButton @click="handleClose">取消</ElButton>
      <ElButton type="primary" @click="savePermission" :loading="saving">保存</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { updateRole, type RoleItem } from '@/api/admin-role'
import { ElMessage } from 'element-plus'

interface Props {
  modelValue: boolean
  roleData?: RoleItem
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  roleData: undefined,
})

const emit = defineEmits<Emits>()
const saving = ref(false)
const checkedPermissions = ref<string[]>([])

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const permissionGroups = [
  {
    label: '用户管理',
    items: [{ value: 'user:manage', label: '用户管理' }],
  },
  {
    label: '交易管理',
    items: [{ value: 'trade:manage', label: '交易管理' }],
  },
  {
    label: '资金管理',
    items: [{ value: 'fund:manage', label: '资金管理' }],
  },
  {
    label: '风控管理',
    items: [{ value: 'risk:manage', label: '风控管理' }],
  },
  {
    label: '系统管理',
    items: [
      { value: 'admin:manage', label: '管理员管理' },
      { value: 'system:config', label: '系统配置' },
      { value: 'system:audit', label: '审计日志' },
      { value: 'data:export', label: '数据导出' },
    ],
  },
]

const allPermissionValues = permissionGroups.flatMap(g => g.items.map(i => i.value))

const isAllSelected = computed(() => {
  return checkedPermissions.value.length === allPermissionValues.length
})

watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal && props.roleData) {
      const perms = props.roleData.permissions
      if (Array.isArray(perms)) {
        checkedPermissions.value = [...perms]
      } else if (typeof perms === 'string') {
        try {
          checkedPermissions.value = JSON.parse(perms)
        } catch {
          checkedPermissions.value = []
        }
      } else {
        checkedPermissions.value = []
      }
    }
  }
)

function selectAll() {
  if (isAllSelected.value) {
    checkedPermissions.value = []
  } else {
    checkedPermissions.value = [...allPermissionValues]
  }
}

function handleClose() {
  visible.value = false
}

async function savePermission() {
  if (!props.roleData) return
  saving.value = true
  try {
    await updateRole(props.roleData.id, {
      permissions: checkedPermissions.value as any,
    })
    ElMessage.success('权限保存成功')
    emit('success')
    handleClose()
  } catch (error) {
    console.error('权限保存失败:', error)
  } finally {
    saving.value = false
  }
}
</script>
