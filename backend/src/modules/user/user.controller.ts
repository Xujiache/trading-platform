import { FastifyRequest, FastifyReply } from 'fastify';
import { success, fail } from '../../utils/response';
import { updateProfileSchema, changePasswordSchema, kycSubmitSchema } from './user.schema';
import * as userService from './user.service';

/**
 * 获取个人信息
 */
export async function getProfile(request: FastifyRequest, reply: FastifyReply) {
  const result = await userService.getProfile(request.currentUser!.id);
  return success(reply, result);
}

/**
 * 修改个人资料
 */
export async function updateProfile(request: FastifyRequest, reply: FastifyReply) {
  const parsed = updateProfileSchema.safeParse(request.body);
  if (!parsed.success) {
    return fail(reply, '参数验证失败', 1022, 422, parsed.error.errors);
  }
  const result = await userService.updateProfile(request.currentUser!.id, parsed.data);
  return success(reply, result);
}

/**
 * 修改密码
 */
export async function changePassword(request: FastifyRequest, reply: FastifyReply) {
  const parsed = changePasswordSchema.safeParse(request.body);
  if (!parsed.success) {
    return fail(reply, '参数验证失败', 1022, 422, parsed.error.errors);
  }
  const result = await userService.changePassword(request.currentUser!.id, parsed.data);
  return success(reply, result);
}

/**
 * 提交 KYC
 */
export async function submitKyc(request: FastifyRequest, reply: FastifyReply) {
  const parsed = kycSubmitSchema.safeParse(request.body);
  if (!parsed.success) {
    return fail(reply, '参数验证失败', 1022, 422, parsed.error.errors);
  }
  const result = await userService.submitKyc(request.currentUser!.id, parsed.data);
  return success(reply, result);
}

/**
 * 上传头像
 */
export async function uploadAvatar(request: FastifyRequest, reply: FastifyReply) {
  const data = await request.file();
  if (!data) {
    return fail(reply, '请选择文件', 1022, 400);
  }
  const buffer = await data.toBuffer();
  const result = await userService.uploadAvatar(request.currentUser!.id, buffer, data.filename);
  return success(reply, result);
}

/**
 * 获取 KYC 状态
 */
export async function getKycStatus(request: FastifyRequest, reply: FastifyReply) {
  const result = await userService.getKycStatus(request.currentUser!.id);
  return success(reply, result);
}
