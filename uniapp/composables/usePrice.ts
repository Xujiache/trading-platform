/**
 * 价格格式化 Composable
 * 封装价格显示相关的格式化工具
 */
export function usePrice() {
  /**
   * 格式化价格（保留指定精度）
   * @param price - 价格数值
   * @param precision - 小数位数（默认2）
   */
  function formatPrice(price: number | string | undefined, precision = 2): string {
    if (price === undefined || price === null) return '--';
    const num = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(num)) return '--';
    return num.toFixed(precision);
  }

  /**
   * 格式化金额（千分位 + 两位小数）
   * @param amount - 金额
   */
  function formatMoney(amount: number | string | undefined): string {
    if (amount === undefined || amount === null) return '0.00';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  /**
   * 格式化涨跌幅
   * @param value - 变动百分比
   */
  function formatChange(value: number | string | undefined): string {
    if (value === undefined || value === null) return '0.00%';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    const prefix = num > 0 ? '+' : '';
    return `${prefix}${num.toFixed(2)}%`;
  }

  /**
   * 判断涨跌颜色
   * @param value - 涨跌值
   * @returns 'up' | 'down' | 'flat'
   */
  function priceDirection(value: number | string | undefined): 'up' | 'down' | 'flat' {
    if (value === undefined || value === null) return 'flat';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (num > 0) return 'up';
    if (num < 0) return 'down';
    return 'flat';
  }

  return { formatPrice, formatMoney, formatChange, priceDirection };
}
