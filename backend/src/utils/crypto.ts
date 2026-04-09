import * as argon2 from 'argon2';
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { config } from '../config';

/**
 * 密码哈希（Argon2）
 * @param password - 明文密码
 * @returns Argon2 哈希字符串
 */
export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });
}

/**
 * 密码验证
 * @param hash - 存储的哈希值
 * @param password - 用户输入的密码
 * @returns 是否匹配
 */
export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  return argon2.verify(hash, password);
}

interface TokenPayload extends JWTPayload {
  id: number;
  type: 'mobile' | 'admin';
}

/**
 * 生成 JWT Token
 * @param payload - 载荷（包含用户 id 和类型）
 * @param type - Token 类型（mobile/admin）
 * @param expiresIn - 过期时间字符串
 * @returns JWT Token 字符串
 */
export async function generateToken(
  payload: { id: number },
  type: 'mobile' | 'admin',
  expiresIn?: string
): Promise<string> {
  const secret = type === 'mobile' ? config.jwt.mobileSecret : config.jwt.adminSecret;
  const exp = expiresIn || config.jwt.expiresIn;
  const secretKey = new TextEncoder().encode(secret);

  return new SignJWT({ id: payload.id, type } as TokenPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(exp)
    .sign(secretKey);
}

/**
 * 验证 JWT Token
 * @param token - JWT Token 字符串
 * @param type - Token 类型（mobile/admin）
 * @returns 解码后的载荷
 */
export async function verifyToken(token: string, type: 'mobile' | 'admin'): Promise<TokenPayload> {
  const secret = type === 'mobile' ? config.jwt.mobileSecret : config.jwt.adminSecret;
  const secretKey = new TextEncoder().encode(secret);

  const { payload } = await jwtVerify(token, secretKey);
  return payload as TokenPayload;
}

/**
 * 生成 6 位随机数字验证码
 * @returns 6 位数字字符串
 */
export function generateVerifyCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * 生成唯一订单号
 * @param prefix - 订单号前缀（如 D=入金, W=出金, T=交易, P=挂单）
 * @returns 订单号字符串
 */
export function generateOrderNo(prefix: string): string {
  const now = new Date();
  const dateStr = now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0') +
    now.getHours().toString().padStart(2, '0') +
    now.getMinutes().toString().padStart(2, '0') +
    now.getSeconds().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}${dateStr}${random}`;
}
