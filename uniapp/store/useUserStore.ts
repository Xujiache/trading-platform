import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { post, get } from '../utils/request';

interface UserInfo {
  id: number;
  phone: string | null;
  email: string | null;
  nickname: string | null;
  avatar: string | null;
  kycStatus: string;
  twoFactorEnabled: boolean;
  riskLevel: string | null;
  userLevel: { name: string; displayName: string };
}

/**
 * 用户状态管理
 * 管理登录态、用户信息、Token 存储
 */
export const useUserStore = defineStore('user', () => {
  const userInfo = ref<UserInfo | null>(null);
  const accessToken = ref(uni.getStorageSync('accessToken') || '');
  const refreshToken = ref(uni.getStorageSync('refreshToken') || '');

  const isLoggedIn = computed(() => !!accessToken.value);

  /**
   * 登录
   * @param account - 手机号或邮箱
   * @param password - 密码
   * @param twoFactorCode - 可选的 2FA 验证码
   */
  async function login(account: string, password: string, twoFactorCode?: string) {
    const data = await post<{
      user: UserInfo;
      accessToken: string;
      refreshToken: string;
      requireTwoFactor?: boolean;
    }>('/api/mobile/auth/login', { account, password, twoFactorCode });

    if (data.requireTwoFactor) {
      return { requireTwoFactor: true };
    }

    accessToken.value = data.accessToken;
    refreshToken.value = data.refreshToken;
    userInfo.value = data.user;

    uni.setStorageSync('accessToken', data.accessToken);
    uni.setStorageSync('refreshToken', data.refreshToken);

    return data;
  }

  /**
   * 注册
   * @param phone - 手机号
   * @param password - 密码
   * @param code - 短信验证码
   * @param nickname - 可选昵称
   */
  async function register(phone: string, password: string, code: string, nickname?: string) {
    const data = await post<{
      user: UserInfo;
      accessToken: string;
      refreshToken: string;
    }>('/api/mobile/auth/register', { phone, password, code, nickname });

    accessToken.value = data.accessToken;
    refreshToken.value = data.refreshToken;
    userInfo.value = data.user;

    uni.setStorageSync('accessToken', data.accessToken);
    uni.setStorageSync('refreshToken', data.refreshToken);

    return data;
  }

  /** 获取用户信息 */
  async function fetchProfile() {
    const data = await get<UserInfo>('/api/mobile/user/profile');
    userInfo.value = data;
    return data;
  }

  /** 退出登录 */
  function logout() {
    accessToken.value = '';
    refreshToken.value = '';
    userInfo.value = null;
    uni.removeStorageSync('accessToken');
    uni.removeStorageSync('refreshToken');
    uni.reLaunch({ url: '/pages/auth/login' });
  }

  return {
    userInfo,
    accessToken,
    refreshToken,
    isLoggedIn,
    login,
    register,
    fetchProfile,
    logout,
  };
});
