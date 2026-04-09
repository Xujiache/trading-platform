import dayjs from 'dayjs';

/**
 * 格式化日期
 * @param date - 日期值
 * @param format - 格式模板
 */
export function formatDate(date: string | Date | undefined, format = 'YYYY-MM-DD HH:mm'): string {
  if (!date) return '-';
  return dayjs(date).format(format);
}

/**
 * 格式化金额
 * @param amount - 金额
 * @param precision - 精度
 */
export function formatMoney(amount: number | string | undefined, precision = 2): string {
  if (amount === undefined || amount === null) return '0.00';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return num.toFixed(precision);
}

/**
 * 格式化涨跌幅
 * @param value - 百分比值
 */
export function formatPercent(value: number | string | undefined): string {
  if (value === undefined || value === null) return '0.00%';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  const prefix = num > 0 ? '+' : '';
  return `${prefix}${num.toFixed(2)}%`;
}

/**
 * 脱敏手机号
 */
export function maskPhone(phone: string | undefined): string {
  if (!phone) return '-';
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
}

/**
 * 脱敏银行卡号
 */
export function maskCard(card: string | undefined): string {
  if (!card) return '-';
  return `**** **** **** ${card.slice(-4)}`;
}

/**
 * 格式化相对时间（几分钟前/几小时前）
 */
export function formatTimeAgo(date: string | Date | undefined): string {
  if (!date) return '-';
  const now = dayjs();
  const target = dayjs(date);
  const diffMin = now.diff(target, 'minute');

  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return `${diffMin}分钟前`;
  const diffHour = now.diff(target, 'hour');
  if (diffHour < 24) return `${diffHour}小时前`;
  const diffDay = now.diff(target, 'day');
  if (diffDay < 30) return `${diffDay}天前`;
  return target.format('YYYY-MM-DD');
}
