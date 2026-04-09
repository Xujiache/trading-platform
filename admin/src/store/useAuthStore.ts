import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { adminLogin, getAdminProfile } from '../api/auth';

interface AdminInfo {
  id: number;
  username: string;
  realName: string;
  role: { name: string; displayName: string };
  permissions: string[];
}

/**
 * 管理员认证状态管理
 */
export const useAuthStore = defineStore('auth', () => {
  const adminInfo = ref<AdminInfo | null>(null);
  const token = ref(localStorage.getItem('adminToken') || '');

  const isLoggedIn = computed(() => !!token.value);

  async function login(username: string, password: string) {
    const data = (await adminLogin({ username, password })) as unknown as { admin: AdminInfo; accessToken: string };
    token.value = data.accessToken;
    adminInfo.value = data.admin;
    localStorage.setItem('adminToken', data.accessToken);
    return data;
  }

  async function fetchProfile() {
    const data = (await getAdminProfile()) as unknown as AdminInfo;
    adminInfo.value = data;
    return data;
  }

  function logout() {
    token.value = '';
    adminInfo.value = null;
    localStorage.removeItem('adminToken');
  }

  function hasPermission(permission: string) {
    if (!adminInfo.value) return false;
    if (adminInfo.value.permissions.includes('*')) return true;
    return adminInfo.value.permissions.includes(permission);
  }

  return { adminInfo, token, isLoggedIn, login, fetchProfile, logout, hasPermission };
});
