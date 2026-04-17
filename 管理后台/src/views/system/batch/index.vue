<template>
  <div class="art-full-height">
    <ElTabs v-model="activeTab" type="border-card">
      <!-- 批量确认入金 -->
      <ElTabPane label="批量确认入金" name="deposit">
        <ElAlert title="输入待确认的入金记录ID（状态须为 pending），以逗号或换行分隔" type="info" :closable="false" class="mb-4" />
        <ElForm label-width="100px">
          <ElFormItem label="入金ID列表">
            <ElInput v-model="depositForm.idsText" type="textarea" :rows="4" placeholder="例如: 1,2,3 或每行一个ID" />
          </ElFormItem>
          <ElFormItem label="备注">
            <ElInput v-model="depositForm.remark" placeholder="可选备注" />
          </ElFormItem>
          <ElFormItem>
            <ElButton type="primary" @click="submitDeposit" :loading="depositForm.loading" :disabled="!depositForm.idsText.trim()">
              批量确认入金
            </ElButton>
          </ElFormItem>
        </ElForm>
        <BatchResult :result="depositForm.result" />
      </ElTabPane>

      <!-- 批量审核出金 -->
      <ElTabPane label="批量审核出金" name="withdraw">
        <ElAlert title="输入待审核的出金记录ID，以逗号或换行分隔" type="info" :closable="false" class="mb-4" />
        <ElForm label-width="100px">
          <ElFormItem label="出金ID列表">
            <ElInput v-model="withdrawForm.idsText" type="textarea" :rows="4" placeholder="例如: 1,2,3 或每行一个ID" />
          </ElFormItem>
          <ElFormItem label="操作">
            <ElRadioGroup v-model="withdrawForm.action">
              <ElRadio value="approve">通过</ElRadio>
              <ElRadio value="reject">驳回</ElRadio>
              <ElRadio value="complete">完成打款</ElRadio>
            </ElRadioGroup>
          </ElFormItem>
          <ElFormItem label="备注">
            <ElInput v-model="withdrawForm.remark" placeholder="可选备注" />
          </ElFormItem>
          <ElFormItem>
            <ElButton type="primary" @click="submitWithdraw" :loading="withdrawForm.loading" :disabled="!withdrawForm.idsText.trim()">
              批量审核出金
            </ElButton>
          </ElFormItem>
        </ElForm>
        <BatchResult :result="withdrawForm.result" />
      </ElTabPane>

      <!-- 批量冻结/解冻用户 -->
      <ElTabPane label="批量冻结/解冻用户" name="user">
        <ElAlert title="输入用户ID列表，以逗号或换行分隔" type="info" :closable="false" class="mb-4" />
        <ElForm label-width="100px">
          <ElFormItem label="用户ID列表">
            <ElInput v-model="userForm.idsText" type="textarea" :rows="4" placeholder="例如: 1,2,3 或每行一个ID" />
          </ElFormItem>
          <ElFormItem label="操作">
            <ElRadioGroup v-model="userForm.action">
              <ElRadio value="freeze">冻结</ElRadio>
              <ElRadio value="unfreeze">解冻</ElRadio>
            </ElRadioGroup>
          </ElFormItem>
          <ElFormItem label="原因" v-if="userForm.action === 'freeze'">
            <ElInput v-model="userForm.reason" placeholder="冻结原因" />
          </ElFormItem>
          <ElFormItem>
            <ElButton type="primary" @click="submitUser" :loading="userForm.loading" :disabled="!userForm.idsText.trim()">
              批量{{ userForm.action === 'freeze' ? '冻结' : '解冻' }}用户
            </ElButton>
          </ElFormItem>
        </ElForm>
        <BatchResult :result="userForm.result" />
      </ElTabPane>
    </ElTabs>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, defineComponent, h } from 'vue'
import { ElMessage, ElMessageBox, ElTag } from 'element-plus'
import { batchDepositConfirm, batchWithdrawAudit, batchUserStatus, type BatchResult as BR } from '@/api/admin-system'

defineOptions({ name: 'BatchOperation' })

const BatchResult = defineComponent({
  props: { result: { type: Object as () => BR | null, default: null } },
  setup(props) {
    return () => {
      if (!props.result) return null
      return h('div', { class: 'mt-4' }, [
        h('div', { class: 'mb-2' }, [
          h(ElTag, { type: 'success', class: 'mr-2' }, () => `成功: ${props.result!.success.length}`),
          h(ElTag, { type: 'danger' }, () => `失败: ${props.result!.failed.length}`),
        ]),
        props.result!.failed.length > 0
          ? h('div', [
              h('p', { class: 'text-sm text-gray-500 mb-1' }, '失败详情:'),
              ...props.result!.failed.map((f: any) =>
                h('p', { class: 'text-xs text-red-500' }, `ID ${f.id}: ${f.reason}`)
              ),
            ])
          : null,
      ])
    }
  },
})

function parseIds(text: string): number[] {
  return text.split(/[,，\n\r\s]+/).map(s => s.trim()).filter(Boolean).map(Number).filter(n => !isNaN(n) && n > 0)
}

const activeTab = ref('deposit')

const depositForm = reactive({ idsText: '', remark: '', loading: false, result: null as BR | null })
const withdrawForm = reactive({ idsText: '', action: 'approve' as 'approve' | 'reject' | 'complete', remark: '', loading: false, result: null as BR | null })
const userForm = reactive({ idsText: '', action: 'freeze' as 'freeze' | 'unfreeze', reason: '', loading: false, result: null as BR | null })

async function submitDeposit() {
  const ids = parseIds(depositForm.idsText)
  if (!ids.length) return ElMessage.warning('请输入有效的ID')
  try {
    await ElMessageBox.confirm(`确认要批量确认 ${ids.length} 条入金记录吗？`, '确认操作', { type: 'warning' })
    depositForm.loading = true
    const res = await batchDepositConfirm(ids, depositForm.remark)
    depositForm.result = res
    ElMessage.success(`批量确认完成`)
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error(e?.message || '操作失败')
  } finally { depositForm.loading = false }
}

async function submitWithdraw() {
  const ids = parseIds(withdrawForm.idsText)
  if (!ids.length) return ElMessage.warning('请输入有效的ID')
  const actionLabel = { approve: '通过', reject: '驳回', complete: '完成打款' }[withdrawForm.action]
  try {
    await ElMessageBox.confirm(`确认要批量${actionLabel} ${ids.length} 条出金记录吗？`, '确认操作', { type: 'warning' })
    withdrawForm.loading = true
    const res = await batchWithdrawAudit(ids, withdrawForm.action, withdrawForm.remark)
    withdrawForm.result = res
    ElMessage.success(`批量审核完成`)
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error(e?.message || '操作失败')
  } finally { withdrawForm.loading = false }
}

async function submitUser() {
  const ids = parseIds(userForm.idsText)
  if (!ids.length) return ElMessage.warning('请输入有效的ID')
  const actionLabel = userForm.action === 'freeze' ? '冻结' : '解冻'
  try {
    await ElMessageBox.confirm(`确认要批量${actionLabel} ${ids.length} 个用户吗？`, '确认操作', { type: 'warning' })
    userForm.loading = true
    const res = await batchUserStatus(ids, userForm.action, userForm.reason)
    userForm.result = res
    ElMessage.success(`批量${actionLabel}完成`)
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error(e?.message || '操作失败')
  } finally { userForm.loading = false }
}
</script>
