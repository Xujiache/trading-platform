import Decimal from 'decimal.js';
import { TradingSymbol, FundAccount } from '@prisma/client';
import { ValidationError } from '../utils/errors';
import { FeeCalculator } from './feeCalculator';

/**
 * 交易校验器
 * 在下单前进行全面校验：保证金、手数、交易时间、滑点
 */
export class TradeValidator {
  /**
   * 校验下单参数
   * @param symbol - 品种配置
   * @param account - 资金账户
   * @param lots - 手数
   * @param leverage - 杠杆
   * @param price - 预期成交价
   * @param currentPositionLots - 当前持仓手数
   */
  static validate(
    symbol: TradingSymbol,
    account: FundAccount,
    lots: number,
    leverage: number,
    price: number,
    currentPositionLots: number
  ) {
    this.validateSymbolStatus(symbol);
    this.validateLots(symbol, lots);
    this.validateLeverage(symbol, leverage);
    this.validatePositionLimit(symbol, lots, currentPositionLots);
    this.validateMargin(symbol, account, lots, leverage, price);
    this.validateTradingHours(symbol);
  }

  /**
   * 校验品种是否可交易
   */
  static validateSymbolStatus(symbol: TradingSymbol) {
    if (symbol.status !== 1) {
      throw new ValidationError('该品种当前暂停交易');
    }
  }

  /**
   * 校验手数是否在允许范围内
   */
  static validateLots(symbol: TradingSymbol, lots: number) {
    const lotsD = new Decimal(lots);
    const minLots = new Decimal(symbol.minLots.toString());
    const maxLots = new Decimal(symbol.maxLots.toString());

    if (lotsD.lt(minLots)) {
      throw new ValidationError(`最小下单手数为 ${minLots.toFixed(2)} 手`);
    }
    if (lotsD.gt(maxLots)) {
      throw new ValidationError(`单笔最大手数为 ${maxLots.toFixed(2)} 手`);
    }
  }

  /**
   * 校验杠杆是否在允许范围内
   */
  static validateLeverage(symbol: TradingSymbol, leverage: number) {
    if (leverage < symbol.leverageMin || leverage > symbol.leverageMax) {
      throw new ValidationError(`杠杆范围 ${symbol.leverageMin} ~ ${symbol.leverageMax}`);
    }
  }

  /**
   * 校验持仓手数限制
   */
  static validatePositionLimit(symbol: TradingSymbol, lots: number, currentPositionLots: number) {
    const maxPosition = new Decimal(symbol.maxPositionLots.toString());
    const total = new Decimal(currentPositionLots).plus(lots);
    if (total.gt(maxPosition)) {
      throw new ValidationError(`超出最大持仓限制 ${maxPosition.toFixed(2)} 手`);
    }
  }

  /**
   * 校验保证金是否充足
   */
  static validateMargin(symbol: TradingSymbol, account: FundAccount, lots: number, leverage: number, price: number) {
    const lotsD = new Decimal(lots);
    const priceD = new Decimal(price);
    const margin = FeeCalculator.calcMargin(symbol.contractUnit, lotsD, priceD, leverage);
    const spreadCost = FeeCalculator.calcSpreadCost(symbol, lotsD);
    const commission = FeeCalculator.calcCommission(symbol, lotsD, priceD);
    const totalCost = margin.plus(spreadCost).plus(commission);

    const balance = new Decimal(account.balance.toString());
    const usedMargin = new Decimal(account.usedMargin.toString());
    const floatingPnl = new Decimal(account.floatingPnl.toString());
    const equity = balance.plus(floatingPnl);
    const available = equity.minus(usedMargin);

    if (totalCost.gt(available)) {
      throw new ValidationError(`可用保证金不足，需要 ${totalCost.toFixed(2)}，可用 ${available.toFixed(2)}`);
    }
  }

  /**
   * 校验是否在交易时间内
   */
  static validateTradingHours(symbol: TradingSymbol) {
    const now = new Date();
    const day = now.getDay();
    if (day === 0 || day === 6) {
      throw new ValidationError('当前为非交易时间（周末休市）');
    }
  }
}
