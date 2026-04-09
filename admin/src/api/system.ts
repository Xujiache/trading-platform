import request from '../utils/request';

/**
 * 获取角色列表
 */
export function getRoleList() {
  return request.get('/role');
}

/**
 * 创建角色
 */
export function createRole(data: Record<string, unknown>) {
  return request.post('/role', data);
}

/**
 * 更新角色
 */
export function updateRole(id: number, data: Record<string, unknown>) {
  return request.put(`/role/${id}`, data);
}

/**
 * 删除角色
 */
export function deleteRole(id: number) {
  return request.delete(`/role/${id}`);
}

/**
 * 获取管理员列表
 */
export function getAdminList() {
  return request.get('/admin');
}

/**
 * 创建管理员
 */
export function createAdmin(data: Record<string, unknown>) {
  return request.post('/admin', data);
}

/**
 * 更新管理员
 */
export function updateAdmin(id: number, data: Record<string, unknown>) {
  return request.put(`/admin/${id}`, data);
}

/**
 * 启用/禁用管理员
 */
export function updateAdminStatus(id: number, status: number) {
  return request.put(`/admin/${id}/status`, { status });
}

/**
 * 获取系统配置
 */
export function getSystemConfig(params?: Record<string, unknown>) {
  return request.get('/config', { params });
}

/**
 * 更新系统配置
 */
export function updateSystemConfig(data: Record<string, unknown>[]) {
  return request.put('/config', data);
}

/**
 * 获取 SMTP 配置
 */
export function getSmtpConfig() {
  return request.get('/config/smtp');
}

/**
 * 更新 SMTP 配置
 */
export function updateSmtpConfig(data: Record<string, unknown>) {
  return request.put('/config/smtp', data);
}

/**
 * 发送测试邮件
 */
export function testSmtp() {
  return request.post('/config/smtp/test');
}
