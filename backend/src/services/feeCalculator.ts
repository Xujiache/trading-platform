import Decimal from 'decimal.js';
import { TradingSymbol } from '@prisma/client';

/**
 * 费用计算器
 * 所有金融计算使用 decimal.js 保证精度
 */
export class FeeCalculator {
  /**
   * 计算保证金
   * 已用保证金 = (合约单位 × 手数 × 开仓价格) / 杠杆比例
   * @param contractUnit - 合约单位
   * @param lots - 手数
   * @param price - 开仓价格
   * @param leverage - 杠杆倍数
   * @returns 保证金金额
   */
  static calcMargin(contractUnit: number, lots: Decimal, price: Decimal, leverage: number): Decimal {
    return new Decimal(contractUnit).mul(lots).mul(price).div(leverage);
  }

  /**
   * 计算点差成本
   * 固定点差成本 = 点差值 × 合约单位 × 手数
   * @param symbol - 品种配置
   * @param lots - 手数
   * @returns 点差成本
   */
  static calcSpreadCost(symbol: TradingSymbol, lots: Decimal): Decimal {
    const spreadValue = new Decimal(symbol.spreadValue.toString());
    return spreadValue.mul(symbol.contractUnit).mul(lots);
  }

  /**
   * 计算手续费
   * 按手数: 每手手续费 × 手数
   * 按金额: 合约单位 × 手数 × 成交价 × 费率
   * @param symbol - 品种配置
   * @param lots - 手数
   * @param price - 成交价
   * @param feeDiscount - 用户等级手续费折扣
   * @returns 手续费
   */
  static calcCommission(symbol: TradingSymbol, lots: Decimal, price: Decimal, feeDiscount: Decimal = new Decimal(1)): Decimal {
    let fee: Decimal;
    const commValue = new Decimal(symbol.commissionValue.toString());

    if (symbol.commissionType === 'per_lot') {
      fee = commValue.mul(lots);
    } else {
      fee = new Decimal(symbol.contractUnit).mul(lots).mul(price).mul(commValue);
    }

    return fee.mul(feeDiscount).toDecimalPlaces(2);
  }

  /**
   * 计算浮动盈亏
   * 做多: (当前价 - 开仓价) × 合约单位 × 手数
   * 做空: (开仓价 - 当前价) × 合约单位 × 手数
   * @param direction - 方向（buy/sell）
   * @param openPrice - 开仓价
   * @param currentPrice - 当前价
   * @param contractUnit - 合约单位
   * @param lots - 手数
   * @returns 浮动盈亏
   */
  static calcFloatingPnl(direction: string, openPrice: Decimal, currentPrice: Decimal, contractUnit: number, lots: Decimal): Decimal {
    if (direction === 'buy') {
      return currentPrice.minus(openPrice).mul(contractUnit).mul(lots);
    }
    return openPrice.minus(currentPrice).mul(contractUnit).mul(lots);
  }

  /**
   * 计算隔夜费
   * 隔夜费 = (合约单位 × 手数 × 当日结算价 × 隔夜费利率) / 360
   * @param contractUnit - 合约单位
   * @param lots - 手数
   * @param settlePrice - 结算价
   * @param swapRate - 隔夜费利率
   * @param multiplier - 倍数（周三=3，其他=1）
   * @returns 隔夜费
   */
  static calcSwapFee(contractUnit: number, lots: Decimal, settlePrice: Decimal, swapRate: Decimal, multiplier = 1): Decimal {
    return new Decimal(contractUnit)
      .mul(lots)
      .mul(settlePrice)
      .mul(swapRate)
      .div(360)
      .mul(multiplier)
      .toDecimalPlaces(2);
  }

  /**
   * 费用预估（下单前展示）
   * @returns 保证金、点差成本、手续费
   */
  static estimate(symbol: TradingSymbol, lots: number, leverage: number, price: number, feeDiscount = 1) {
    const lotsD = new Decimal(lots);
    const priceD = new Decimal(price);
    const discountD = new Decimal(feeDiscount);

    const margin = this.calcMargin(symbol.contractUnit, lotsD, priceD, leverage);
    const spreadCost = this.calcSpreadCost(symbol, lotsD);
    const commission = this.calcCommission(symbol, lotsD, priceD, discountD);

    return {
      margin: margin.toFixed(2),
      spreadCost: spreadCost.toFixed(2),
      commission: commission.toFixed(2),
      total: margin.plus(spreadCost).plus(commission).toFixed(2),
    };
  }
}
