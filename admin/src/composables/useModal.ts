import { ref } from 'vue';

/**
 * 通用弹窗逻辑 Composable
 * 封装弹窗显示/隐藏、编辑模式判断等通用操作
 */
export function useModal() {
  const visible = ref(false);
  const isEdit = ref(false);
  const currentRecord = ref<any>(null);
  const confirmLoading = ref(false);

  function open(record?: any) {
    if (record) {
      isEdit.value = true;
      currentRecord.value = { ...record };
    } else {
      isEdit.value = false;
      currentRecord.value = null;
    }
    visible.value = true;
  }

  function close() {
    visible.value = false;
    currentRecord.value = null;
    confirmLoading.value = false;
  }

  return {
    visible,
    isEdit,
    currentRecord,
    confirmLoading,
    open,
    close,
  };
}
