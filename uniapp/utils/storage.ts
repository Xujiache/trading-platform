/**
 * 本地存储封装
 */
export const storage = {
  /** 设置存储 */
  set(key: string, value: unknown) {
    uni.setStorageSync(key, JSON.stringify(value));
  },

  /** 获取存储 */
  get<T = unknown>(key: string): T | null {
    const raw = uni.getStorageSync(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as T;
    }
  },

  /** 删除存储 */
  remove(key: string) {
    uni.removeStorageSync(key);
  },

  /** 清空全部存储 */
  clear() {
    uni.clearStorageSync();
  },
};
