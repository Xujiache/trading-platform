import { FastifyRequest, FastifyReply } from 'fastify';
import { success, fail } from '../../utils/response';
import { enableTwoFactorSchema, disableTwoFactorSchema, verifyTwoFactorSchema } from './twoFactor.schema';
import * as twoFactorService from './twoFactor.service';

/**
 * 生成 TOTP 二维码
 */
export async function generate(request: FastifyRequest, reply: FastifyReply) {
  const result = await twoFactorService.generateSecret(request.currentUser!.id);
  return success(reply, result);
}

/**
 * 启用两步验证
 */
export async function enable(request: FastifyRequest, reply: FastifyReply) {
  const parsed = enableTwoFactorSchema.safeParse(request.body);
  if (!parsed.success) {
    return fail(reply, '参数验证失败', 1022, 422, parsed.error.errors);
  }
  const result = await twoFactorService.enable(request.currentUser!.id, parsed.data);
  return success(reply, result);
}

/**
 * 关闭两步验证
 */
export async function disable(request: FastifyRequest, reply: FastifyReply) {
  const parsed = disableTwoFactorSchema.safeParse(request.body);
  if (!parsed.success) {
    return fail(reply, '参数验证失败', 1022, 422, parsed.error.errors);
  }
  const result = await twoFactorService.disable(request.currentUser!.id, parsed.data);
  return success(reply, result);
}

/**
 * 验证 TOTP 验证码
 */
export async function verify(request: FastifyRequest, reply: FastifyReply) {
  const parsed = verifyTwoFactorSchema.safeParse(request.body);
  if (!parsed.success) {
    return fail(reply, '参数验证失败', 1022, 422, parsed.error.errors);
  }
  const result = await twoFactorService.verify(request.currentUser!.id, parsed.data.code);
  return success(reply, result);
}
