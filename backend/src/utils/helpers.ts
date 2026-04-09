/**
 * 银行卡号脱敏，只显示前4后4位
 * @param cardNumber - 完整银行卡号
 * @returns 脱敏后的卡号
 */
export function maskCardNumber(cardNumber: string): string {
  if (cardNumber.length <= 8) return cardNumber;
  return cardNumber.slice(0, 4) + '****' + cardNumber.slice(-4);
}

/**
 * 身份证号脱敏，只显示前3后4位
 * @param idCard - 完整身份证号
 * @returns 脱敏后的身份证号
 */
export function maskIdCard(idCard: string): string {
  if (idCard.length <= 7) return idCard;
  return idCard.slice(0, 3) + '***********' + idCard.slice(-4);
}

/**
 * 手机号脱敏，只显示前3后4位
 * @param phone - 完整手机号
 * @returns 脱敏后的手机号
 */
export function maskPhone(phone: string): string {
  if (phone.length <= 7) return phone;
  return phone.slice(0, 3) + '****' + phone.slice(-4);
}

/**
 * 解析分页参数，设置默认值并限制最大值
 * @param page - 页码（从 1 开始）
 * @param limit - 每页数量
 * @returns 标准化后的分页参数 { skip, take, page, limit }
 */
export function parsePagination(page?: number, limit?: number) {
  const p = Math.max(1, page || 1);
  const l = Math.min(100, Math.max(1, limit || 20));
  return { skip: (p - 1) * l, take: l, page: p, limit: l };
}
