import { ref } from 'vue';
import { request } from '../utils/request';

/**
 * HTTP 请求 Composable
 * 封装请求加载状态管理
 * @param fetchFn - 请求函数
 */
export function useRequest<T = any>(fetchFn: (...args: any[]) => Promise<T>) {
  const data = ref<T | null>(null);
  const loading = ref(false);
  const error = ref<Error | null>(null);

  async function run(...args: any[]) {
    loading.value = true;
    error.value = null;
    try {
      data.value = await fetchFn(...args);
      return data.value;
    } catch (err) {
      error.value = err as Error;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return { data, loading, error, run };
}
