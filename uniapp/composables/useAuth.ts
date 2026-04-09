import { computed } from 'vue';
import { useUserStore } from '../store/useUserStore';

/**
 * 认证相关 Composable
 * 封装登录状态检查和认证操作
 */
export function useAuth() {
  const userStore = useUserStore();

  const isLoggedIn = computed(() => userStore.isLoggedIn);
  const userInfo = computed(() => userStore.userInfo);
  const isKycApproved = computed(() => userStore.userInfo?.kycStatus === 'approved');
  const hasTwoFactor = computed(() => userStore.userInfo?.twoFactorEnabled);

  /**
   * 检查登录状态，未登录则跳转
   */
  function requireLogin(): boolean {
    if (!isLoggedIn.value) {
      uni.navigateTo({ url: '/pages/auth/login' });
      return false;
    }
    return true;
  }

  /**
   * 检查 KYC 状态，未认证则提示
   */
  function requireKyc(): boolean {
    if (!isKycApproved.value) {
      uni.showModal({
        title: '提示',
        content: '请先完成实名认证',
        confirmText: '去认证',
        success: (res) => {
          if (res.confirm) uni.navigateTo({ url: '/pages/mine/kyc' });
        },
      });
      return false;
    }
    return true;
  }

  return { isLoggedIn, userInfo, isKycApproved, hasTwoFactor, requireLogin, requireKyc };
}
