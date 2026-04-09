import request from '../utils/request';

/**
 * 获取用户列表
 */
export function getUserList(params: Record<string, unknown>) {
  return request.get('/user', { params });
}

/**
 * 获取用户详情
 */
export function getUserDetail(id: number) {
  return request.get(`/user/${id}`);
}

/**
 * 冻结/解冻用户
 */
export function updateUserStatus(id: number, status: number) {
  return request.put(`/user/${id}/status`, { status });
}

/**
 * 重置用户密码
 */
export function resetUserPassword(id: number, newPassword: string) {
  return request.put(`/user/${id}/reset-password`, { newPassword });
}

/**
 * 获取待审核 KYC 列表
 */
export function getPendingKyc(params?: Record<string, unknown>) {
  return request.get('/user/kyc/pending', { params });
}

/**
 * KYC 审核
 */
export function reviewKyc(id: number, data: { status: string; reason?: string }) {
  return request.put(`/user/kyc/${id}/review`, data);
}
