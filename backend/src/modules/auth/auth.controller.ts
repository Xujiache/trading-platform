import { FastifyRequest, FastifyReply } from 'fastify';
import { success, fail } from '../../utils/response';
import { AppError } from '../../utils/errors';
import { registerSchema, loginSchema, sendCodeSchema, forgotPasswordSchema, refreshTokenSchema } from './auth.schema';
import * as authService from './auth.service';

/**
 * 用户注册
 */
export async function register(request: FastifyRequest, reply: FastifyReply) {
  const parsed = registerSchema.safeParse(request.body);
  if (!parsed.success) {
    return fail(reply, '参数验证失败', 1022, 422, parsed.error.errors);
  }
  const result = await authService.register(parsed.data);
  return success(reply, result, '注册成功', 201);
}

/**
 * 用户登录
 */
export async function login(request: FastifyRequest, reply: FastifyReply) {
  const parsed = loginSchema.safeParse(request.body);
  if (!parsed.success) {
    return fail(reply, '参数验证失败', 1022, 422, parsed.error.errors);
  }
  const result = await authService.login(parsed.data, request.ip);
  return success(reply, result);
}

/**
 * 发送验证码
 */
export async function sendCode(request: FastifyRequest, reply: FastifyReply) {
  const parsed = sendCodeSchema.safeParse(request.body);
  if (!parsed.success) {
    return fail(reply, '参数验证失败', 1022, 422, parsed.error.errors);
  }
  const result = await authService.sendCode(parsed.data.phone, parsed.data.type);
  return success(reply, result);
}

/**
 * 忘记密码
 */
export async function forgotPassword(request: FastifyRequest, reply: FastifyReply) {
  const parsed = forgotPasswordSchema.safeParse(request.body);
  if (!parsed.success) {
    return fail(reply, '参数验证失败', 1022, 422, parsed.error.errors);
  }
  const result = await authService.forgotPassword(parsed.data);
  return success(reply, result);
}

/**
 * 刷新 Token
 */
export async function refreshToken(request: FastifyRequest, reply: FastifyReply) {
  const parsed = refreshTokenSchema.safeParse(request.body);
  if (!parsed.success) {
    return fail(reply, '参数验证失败', 1022, 422, parsed.error.errors);
  }
  const result = await authService.refreshAccessToken(parsed.data.refreshToken);
  return success(reply, result);
}
