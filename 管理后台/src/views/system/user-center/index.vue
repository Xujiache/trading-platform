<!-- 个人中心页面 -->
<template>
  <div class="w-full h-full p-0 bg-transparent border-none shadow-none">
    <div class="relative flex-b mt-2.5 max-md:block max-md:mt-1">
      <div class="w-112 mr-5 max-md:w-full max-md:mr-0">
        <div class="art-card-sm relative p-9 pb-6 overflow-hidden text-center">
          <img class="absolute top-0 left-0 w-full h-50 object-cover" src="@imgs/user/bg.webp" />
          <img
            class="relative z-10 w-20 h-20 mt-30 mx-auto object-cover border-2 border-white rounded-full"
            :src="adminInfo.avatar || defaultAvatar"
          />
          <h2 class="mt-5 text-xl font-normal">{{ adminInfo.real_name || adminInfo.username }}</h2>
          <p class="mt-2 text-sm text-gray-500">{{ adminInfo.role_display_name }}</p>

          <div class="w-75 mx-auto mt-7.5 text-left">
            <div class="mt-2.5">
              <ArtSvgIcon icon="ri:mail-line" class="text-g-700" />
              <span class="ml-2 text-sm">{{ adminInfo.email || '未设置' }}</span>
            </div>
            <div class="mt-2.5">
              <ArtSvgIcon icon="ri:user-3-line" class="text-g-700" />
              <span class="ml-2 text-sm">{{ adminInfo.username }}</span>
            </div>
            <div class="mt-2.5">
              <ArtSvgIcon icon="ri:time-line" class="text-g-700" />
              <span class="ml-2 text-sm">上次登录: {{ adminInfo.last_login_at || '未知' }}</span>
            </div>
            <div class="mt-2.5">
              <ArtSvgIcon icon="ri:calendar-line" class="text-g-700" />
              <span class="ml-2 text-sm">注册时间: {{ adminInfo.created_at || '未知' }}</span>
            </div>
          </div>

          <div class="mt-10" v-if="adminInfo.permissions && adminInfo.permissions.length > 0">
            <h3 class="text-sm font-medium">权限标签</h3>
            <div class="flex flex-wrap justify-center mt-3.5">
              <div
                v-for="item in adminInfo.permissions"
                :key="item"
                class="py-1 px-1.5 mr-2.5 mb-2.5 text-xs border border-g-300 rounded"
              >
                {{ item }}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="flex-1 overflow-hidden max-md:w-full max-md:mt-3.5">
        <div class="art-card-sm">
          <h1 class="p-4 text-xl font-normal border-b border-g-300">基本信息</h1>
          <div class="p-5">
            <ElDescriptions :column="1" border>
              <ElDescriptionsItem label="用户名">{{ adminInfo.username }}</ElDescriptionsItem>
              <ElDescriptionsItem label="姓名">{{ adminInfo.real_name || '-' }}</ElDescriptionsItem>
              <ElDescriptionsItem label="邮箱">{{ adminInfo.email || '-' }}</ElDescriptionsItem>
              <ElDescriptionsItem label="手机号">{{ adminInfo.phone || '-' }}</ElDescriptionsItem>
              <ElDescriptionsItem label="角色">
                <ElTag>{{ adminInfo.role_display_name }}</ElTag>
              </ElDescriptionsItem>
              <ElDescriptionsItem label="上次登录">{{ adminInfo.last_login_at || '-' }}</ElDescriptionsItem>
              <ElDescriptionsItem label="创建时间">{{ adminInfo.created_at || '-' }}</ElDescriptionsItem>
            </ElDescriptions>
          </div>
        </div>

        <div class="art-card-sm my-5">
          <h1 class="p-4 text-xl font-normal border-b border-g-300">更改密码</h1>

          <ElForm :model="pwdForm" :rules="pwdRules" ref="pwdFormRef" class="box-border p-5" label-width="120px" label-position="top">
            <ElFormItem label="当前密码" prop="oldPassword">
              <ElInput v-model="pwdForm.oldPassword" type="password" placeholder="请输入当前密码" show-password />
            </ElFormItem>
            <ElFormItem label="新密码" prop="newPassword">
              <ElInput v-model="pwdForm.newPassword" type="password" placeholder="请输入新密码（至少6位）" show-password />
            </ElFormItem>
            <ElFormItem label="确认新密码" prop="confirmPassword">
              <ElInput v-model="pwdForm.confirmPassword" type="password" placeholder="请再次输入新密码" show-password />
            </ElFormItem>
            <div class="flex-c justify-end">
              <ElButton type="primary" @click="handleChangePwd" :loading="changingPwd" v-ripple>保存密码</ElButton>
            </div>
          </ElForm>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { getAdminInfo, changeAdminPassword } from '@/api/admin-auth'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'

defineOptions({ name: 'UserCenter' })

const defaultAvatar = new URL('@/assets/images/user/avatar.webp', import.meta.url).href

const adminInfo = ref<Record<string, any>>({})
const changingPwd = ref(false)
const pwdFormRef = ref<FormInstance>()

const pwdForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const pwdRules = reactive<FormRules>({
  oldPassword: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '新密码至少6位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (_rule: any, value: string, callback: any) => {
        if (value !== pwdForm.newPassword) {
          callback(new Error('两次密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
})

async function loadAdminInfo() {
  try {
    const res = await getAdminInfo()
    adminInfo.value = res || {}
  } catch {}
}

async function handleChangePwd() {
  if (!pwdFormRef.value) return
  try {
    await pwdFormRef.value.validate()
    changingPwd.value = true
    await changeAdminPassword({
      oldPassword: pwdForm.oldPassword,
      newPassword: pwdForm.newPassword,
    })
    ElMessage.success('密码修改成功')
    pwdForm.oldPassword = ''
    pwdForm.newPassword = ''
    pwdForm.confirmPassword = ''
    pwdFormRef.value.resetFields()
  } catch {} finally {
    changingPwd.value = false
  }
}

onMounted(() => {
  loadAdminInfo()
})
</script>
