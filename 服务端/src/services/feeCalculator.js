/**
 * 费用计算引擎
 * 保证金、点差成本、手续费、隔夜费、盈亏计算
 */

function calcMargin(symbolInfo, lots, price, leverage) {
  const contractUnit = getContractMultiplier(symbolInfo);
  const contractValue = price * lots * contractUnit;
  return parseFloat((contractValue / leverage).toFixed(4));
}

function calcSpreadCost(symbolInfo, lots) {
  const spread = parseFloat(symbolInfo.spread_fixed) || 0;
  const tickValue = parseFloat(symbolInfo.tick_value) || 0.01;
  const contractUnit = getContractMultiplier(symbolInfo);
  return parseFloat((spread * tickValue * lots * contractUnit).toFixed(4));
}

function calcCommission(symbolInfo, lots, price) {
  const feeType = symbolInfo.fee_type;
  const feeValue = parseFloat(symbolInfo.fee_value) || 0;
  if (feeType === 'per_lot') {
    return parseFloat((feeValue * lots).toFixed(4));
  }
  const contractUnit = getContractMultiplier(symbolInfo);
  return parseFloat((price * lots * contractUnit * feeValue / 100).toFixed(4));
}

function calcSwap(symbolInfo, lots, direction, days = 1) {
  const rate = direction === 'buy'
    ? parseFloat(symbolInfo.swap_long_rate) || 0
    : parseFloat(symbolInfo.swap_short_rate) || 0;

  const contractUnit = getContractMultiplier(symbolInfo);
  const swapPerDay = rate * lots * contractUnit;

  let multiplier = 1;
  const now = new Date();
  const dayOfWeek = now.getDay();
  if (dayOfWeek === 3) {
    multiplier = parseInt(symbolInfo.swap_wednesday_multiplier) || 3;
  }

  return parseFloat((swapPerDay * days * multiplier).toFixed(4));
}

function calcFloatingPnl(symbolInfo, direction, lots, openPrice, currentPrice) {
  const contractUnit = getContractMultiplier(symbolInfo);
  let pnl;
  if (direction === 'buy') {
    pnl = (currentPrice - openPrice) * lots * contractUnit;
  } else {
    pnl = (openPrice - currentPrice) * lots * contractUnit;
  }
  return parseFloat(pnl.toFixed(4));
}

function calcNetPnl(realizedPnl, commission, commissionClose, swapTotal, spreadCost) {
  const net = realizedPnl - commission - commissionClose - Math.abs(swapTotal) - spreadCost;
  return parseFloat(net.toFixed(4));
}

function estimateOrderFees(symbolInfo, lots, price, leverage, direction) {
  const margin = calcMargin(symbolInfo, lots, price, leverage);
  const spreadCost = calcSpreadCost(symbolInfo, lots);
  const commission = calcCommission(symbolInfo, lots, price);
  const commissionClose = symbolInfo.fee_mode === 'both_side' ? commission : 0;
  const swapPerDay = calcSwap(symbolInfo, lots, direction, 1);

  return {
    margin,
    spreadCost,
    commission,
    commissionClose,
    swapPerDay,
    totalOpenCost: parseFloat((margin + commission).toFixed(4)),
  };
}

function getContractMultiplier(symbolInfo) {
  const unit = symbolInfo.contract_unit || '';
  const match = unit.match(/([\d.]+)/);
  if (match) return parseFloat(match[1]);
  return 1;
}

module.exports = {
  calcMargin,
  calcSpreadCost,
  calcCommission,
  calcSwap,
  calcFloatingPnl,
  calcNetPnl,
  estimateOrderFees,
  getContractMultiplier,
};
