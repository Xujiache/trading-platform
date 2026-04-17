const { query, getConnection } = require('../config/database');
const marketData = require('./marketDataService');
const feeCalc = require('./feeCalculator');
const accountService = require('./accountService');

let settlementTimer = null;
let lastSettlementDate = null;

async function settleSwap() {
  const today = new Date().toISOString().split('T')[0];
  if (lastSettlementDate === today) return;

  const dayOfWeek = new Date().getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) return;

  try {
    console.log('[SwapSettlement] 开始隔夜费结算...');

    const openOrders = await query("SELECT * FROM trade_orders WHERE status = 'open'");

    let settledCount = 0;
    for (const order of openOrders) {
      const symbolInfo = marketData.getSymbolInfo(order.symbol);
      if (!symbolInfo) continue;

      const swapAmount = feeCalc.calcSwap(
        symbolInfo, parseFloat(order.lots), order.direction, 1
      );

      if (swapAmount === 0) continue;

      const conn = await getConnection();
      try {
        await conn.beginTransaction();

        await conn.execute(
          'UPDATE trade_orders SET swap_total = swap_total + ? WHERE id = ?',
          [swapAmount, order.id]
        );

        const [account] = await conn.execute(
          'SELECT balance FROM fund_accounts WHERE user_id = ? AND account_type = ?',
          [order.user_id, order.account_type]
        );
        const balanceBefore = account.length > 0 ? parseFloat(account[0].balance) : 0;

        await conn.execute(
          `UPDATE fund_accounts SET balance = balance + ?, total_swap = total_swap + ?
           WHERE user_id = ? AND account_type = ?`,
          [swapAmount, Math.abs(swapAmount), order.user_id, order.account_type]
        );

        const balanceAfter = balanceBefore + swapAmount;
        await accountService.recordFlow(
          order.user_id, order.account_type, order.id, 'swap',
          swapAmount, balanceBefore, balanceAfter,
          `隔夜费 ${order.symbol} ${order.direction} ${order.lots}手`,
          conn
        );

        await conn.commit();
        settledCount++;
      } catch (err) {
        await conn.rollback();
        console.error(`[SwapSettlement] 结算失败 订单${order.order_no}: ${err.message}`);
      } finally {
        conn.release();
      }
    }

    lastSettlementDate = today;
    console.log(`[SwapSettlement] 隔夜费结算完成，共处理 ${settledCount} 笔订单`);
  } catch (err) {
    console.error('[SwapSettlement] 隔夜费结算异常:', err.message);
  }
}

function startSwapSettlement() {
  if (settlementTimer) return;

  settlementTimer = setInterval(() => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();

    if (hours === 5 && minutes === 0) {
      settleSwap();
    }
  }, 60000);

  console.log('[SwapSettlement] 隔夜费结算定时任务已启动（每日05:00执行）');
}

function stopSwapSettlement() {
  if (settlementTimer) { clearInterval(settlementTimer); settlementTimer = null; }
}

module.exports = { startSwapSettlement, stopSwapSettlement, settleSwap };
