import { FastifyRequest, FastifyReply } from 'fastify';
import { success, fail, paginate } from '../../utils/response';
import {
  adminLoginSchema, createAdminSchema, updateAdminSchema,
  adminChangePasswordSchema, adminStatusSchema,
  adminUserListSchema, kycReviewSchema, resetUserPasswordSchema, userStatusSchema,
} from './admin.schema';
import * as adminService from './admin.service';

// ==================== 管理员自身操作 ====================

/**
 * 管理员登录
 */
export async function login(request: FastifyRequest, reply: FastifyReply) {
  const parsed = adminLoginSchema.safeParse(request.body);
  if (!parsed.success) return fail(reply, '参数验证失败', 1022, 422, parsed.error.errors);
  const result = await adminService.login(parsed.data, request.ip);
  return success(reply, result);
}

/**
 * 获取管理员信息
 */
export async function getProfile(request: FastifyRequest, reply: FastifyReply) {
  const result = await adminService.getProfile(request.currentAdmin!.id);
  return success(reply, result);
}

/**
 * 修改管理员密码
 */
export async function changePassword(request: FastifyRequest, reply: FastifyReply) {
  const parsed = adminChangePasswordSchema.safeParse(request.body);
  if (!parsed.success) return fail(reply, '参数验证失败', 1022, 422, parsed.error.errors);
  const result = await adminService.changePassword(request.currentAdmin!.id, parsed.data);
  return success(reply, result);
}

// ==================== 管理员管理 ====================

/**
 * 管理员列表
 */
export async function listAdmins(request: FastifyRequest, reply: FastifyReply) {
  const result = await adminService.listAdmins();
  return success(reply, result);
}

/**
 * 创建管理员
 */
export async function createAdmin(request: FastifyRequest, reply: FastifyReply) {
  const parsed = createAdminSchema.safeParse(request.body);
  if (!parsed.success) return fail(reply, '参数验证失败', 1022, 422, parsed.error.errors);
  const result = await adminService.createAdmin(parsed.data);
  return success(reply, result, '创建成功', 201);
}

/**
 * 更新管理员
 */
export async function updateAdmin(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const parsed = updateAdminSchema.safeParse(request.body);
  if (!parsed.success) return fail(reply, '参数验证失败', 1022, 422, parsed.error.errors);
  const result = await adminService.updateAdmin(parseInt(id, 10), parsed.data);
  return success(reply, result);
}

/**
 * 启用/禁用管理员
 */
export async function updateAdminStatus(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const parsed = adminStatusSchema.safeParse(request.body);
  if (!parsed.success) return fail(reply, '参数验证失败', 1022, 422, parsed.error.errors);
  const result = await adminService.updateAdminStatus(parseInt(id, 10), parsed.data.status);
  return success(reply, result);
}

// ==================== 管理端用户管理 ====================

/**
 * 用户列表
 */
export async function listUsers(request: FastifyRequest, reply: FastifyReply) {
  const parsed = adminUserListSchema.safeParse(request.query);
  if (!parsed.success) return fail(reply, '参数验证失败', 1022, 422, parsed.error.errors);
  const result = await adminService.listUsers(parsed.data);
  return paginate(reply, result.list, result.total, result.page, result.limit);
}

/**
 * 用户详情
 */
export async function getUserDetail(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const result = await adminService.getUserDetail(parseInt(id, 10));
  return success(reply, result);
}

/**
 * 冻结/解冻用户
 */
export async function updateUserStatus(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const parsed = userStatusSchema.safeParse(request.body);
  if (!parsed.success) return fail(reply, '参数验证失败', 1022, 422, parsed.error.errors);
  const result = await adminService.updateUserStatus(parseInt(id, 10), parsed.data.status);
  return success(reply, result);
}

/**
 * 重置用户密码
 */
export async function resetUserPassword(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const parsed = resetUserPasswordSchema.safeParse(request.body);
  if (!parsed.success) return fail(reply, '参数验证失败', 1022, 422, parsed.error.errors);
  const result = await adminService.resetUserPassword(parseInt(id, 10), parsed.data.newPassword);
  return success(reply, result);
}

/**
 * 待审核 KYC 列表
 */
export async function getPendingKyc(request: FastifyRequest, reply: FastifyReply) {
  const query = request.query as { page?: number; limit?: number };
  const result = await adminService.getPendingKyc(query);
  return paginate(reply, result.list, result.total, result.page, result.limit);
}

/**
 * KYC 审核
 */
export async function reviewKyc(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const parsed = kycReviewSchema.safeParse(request.body);
  if (!parsed.success) return fail(reply, '参数验证失败', 1022, 422, parsed.error.errors);
  const result = await adminService.reviewKyc(parseInt(id, 10), parsed.data);
  return success(reply, result);
}
