import axios from 'axios';
import { Message } from '@arco-design/web-vue';

/**
 * Axios 实例封装
 * 自动携带 Token、拦截 401 跳转登录
 */
const request = axios.create({
  baseURL: '/api/admin',
  timeout: 15000,
});

request.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

request.interceptors.response.use(
  (response) => {
    const { data } = response;
    if (data.code === 0) {
      return data.data;
    }
    Message.error(data.message || '请求失败');
    return Promise.reject(new Error(data.message));
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      window.location.href = '/login';
      return Promise.reject(error);
    }
    Message.error(error.response?.data?.message || '网络错误');
    return Promise.reject(error);
  }
);

export default request;
