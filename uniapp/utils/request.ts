const BASE_URL = 'http://localhost:3000';

interface RequestOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: Record<string, unknown>;
  header?: Record<string, string>;
  showLoading?: boolean;
}

interface ApiResponse<T = unknown> {
  code: number;
  data: T;
  message: string;
}

/**
 * 获取本地存储的 Token
 * @returns accessToken 字符串或空字符串
 */
function getToken(): string {
  return uni.getStorageSync('accessToken') || '';
}

/**
 * 统一 HTTP 请求封装
 * 自动携带 Token、处理登录过期、统一错误提示
 * @param options - 请求选项
 * @returns 解析后的响应数据
 */
export function request<T = unknown>(options: RequestOptions): Promise<T> {
  const { url, method = 'GET', data, header = {}, showLoading = false } = options;

  if (showLoading) {
    uni.showLoading({ title: '加载中...', mask: true });
  }

  const token = getToken();
  if (token) {
    header['Authorization'] = `Bearer ${token}`;
  }
  header['Content-Type'] = header['Content-Type'] || 'application/json';

  return new Promise((resolve, reject) => {
    uni.request({
      url: `${BASE_URL}${url}`,
      method,
      data,
      header,
      success: (res) => {
        if (showLoading) uni.hideLoading();

        const responseData = res.data as ApiResponse<T>;

        if (res.statusCode === 401) {
          uni.removeStorageSync('accessToken');
          uni.removeStorageSync('refreshToken');
          uni.reLaunch({ url: '/pages/auth/login' });
          reject(new Error('登录已过期'));
          return;
        }

        if (responseData.code === 0) {
          resolve(responseData.data);
        } else {
          uni.showToast({ title: responseData.message || '请求失败', icon: 'none' });
          reject(new Error(responseData.message));
        }
      },
      fail: (err) => {
        if (showLoading) uni.hideLoading();
        uni.showToast({ title: '网络错误，请检查网络连接', icon: 'none' });
        reject(err);
      },
    });
  });
}

export const get = <T>(url: string, data?: Record<string, unknown>) => request<T>({ url, method: 'GET', data });
export const post = <T>(url: string, data?: Record<string, unknown>) => request<T>({ url, method: 'POST', data });
export const put = <T>(url: string, data?: Record<string, unknown>) => request<T>({ url, method: 'PUT', data });
export const del = <T>(url: string, data?: Record<string, unknown>) => request<T>({ url, method: 'DELETE', data });
