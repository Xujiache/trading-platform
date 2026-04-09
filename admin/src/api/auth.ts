import request from '../utils/request';

/**
 * 管理员登录
 * @param data - 用户名和密码
 */
export function adminLogin(data: { username: string; password: string }) {
  return request.post('/auth/login', data);
}

/**
 * 获取管理员信息
 */
export function getAdminProfile() {
  return request.get('/auth/profile');
}

/**
 * 修改管理员密码
 */
export function changePassword(data: { oldPassword: string; newPassword: string }) {
  return request.put('/auth/password', data);
}
