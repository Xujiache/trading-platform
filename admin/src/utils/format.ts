import dayjs from 'dayjs';

/**
 * 格式化日期时间
 * @param date - 日期值
 * @param format - 格式模板
 * @returns 格式化后的字符串
 */
export function formatDate(date: string | Date | undefined, format = 'YYYY-MM-DD HH:mm:ss'): string {
  if (!date) return '-';
  return dayjs(date).format(format);
}

/**
 * 格式化金额（保留两位小数，千分位分隔）
 * @param amount - 金额数值
 * @returns 格式化后的金额字符串
 */
export function formatMoney(amount: number | string | undefined): string {
  if (amount === undefined || amount === null) return '0.00';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * 格式化百分比
 * @param value - 数值
 * @param decimals - 小数位
 * @returns 百分比字符串
 */
export function formatPercent(value: number | string | undefined, decimals = 2): string {
  if (value === undefined || value === null) return '0%';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return `${num.toFixed(decimals)}%`;
}

/**
 * 脱敏手机号
 * @param phone - 手机号
 * @returns 脱敏后的手机号
 */
export function maskPhone(phone: string | undefined): string {
  if (!phone) return '-';
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
}

/**
 * 脱敏银行卡号
 * @param card - 银行卡号
 * @returns 脱敏后的卡号
 */
export function maskCard(card: string | undefined): string {
  if (!card) return '-';
  return `****${card.slice(-4)}`;
}
