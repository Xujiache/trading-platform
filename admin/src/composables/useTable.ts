import { ref, reactive } from 'vue';

/**
 * 通用表格逻辑 Composable
 * 封装分页、加载、搜索等通用表格操作
 * @param fetchFn - 数据获取函数，接收 params 返回 { list, pagination }
 */
export function useTable<T = any>(fetchFn: (params: Record<string, any>) => Promise<any>) {
  const tableData = ref<T[]>([]);
  const loading = ref(false);
  const pagination = reactive({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  async function fetchData(params: Record<string, any> = {}) {
    loading.value = true;
    try {
      const res = await fetchFn({
        page: pagination.current,
        limit: pagination.pageSize,
        ...params,
      });
      tableData.value = res.list || res;
      if (res.pagination) {
        pagination.total = res.pagination.total;
      }
    } finally {
      loading.value = false;
    }
  }

  function handlePageChange(page: number) {
    pagination.current = page;
    fetchData();
  }

  function handlePageSizeChange(size: number) {
    pagination.pageSize = size;
    pagination.current = 1;
    fetchData();
  }

  function reset() {
    pagination.current = 1;
    fetchData();
  }

  return {
    tableData,
    loading,
    pagination,
    fetchData,
    handlePageChange,
    handlePageSizeChange,
    reset,
  };
}
