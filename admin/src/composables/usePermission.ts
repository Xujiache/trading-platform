import { useAuthStore } from '../store/useAuthStore';

/**
 * 权限判断 Composable
 * 封装基于角色权限的 UI 控制逻辑
 */
export function usePermission() {
  const authStore = useAuthStore();

  /**
   * 判断是否拥有某个权限
   * @param permission - 权限标识（如 'user:view'）
   */
  function hasPermission(permission: string): boolean {
    return authStore.hasPermission(permission);
  }

  /**
   * 判断是否拥有任一权限
   * @param permissions - 权限标识数组
   */
  function hasAnyPermission(permissions: string[]): boolean {
    return permissions.some((p) => authStore.hasPermission(p));
  }

  /**
   * 判断是否拥有全部权限
   * @param permissions - 权限标识数组
   */
  function hasAllPermissions(permissions: string[]): boolean {
    return permissions.every((p) => authStore.hasPermission(p));
  }

  return { hasPermission, hasAnyPermission, hasAllPermissions };
}
