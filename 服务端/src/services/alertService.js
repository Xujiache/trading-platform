const { query } = require('../config/database');
const marketData = require('./marketDataService');

const CHECK_INTERVAL_MS = 5000;
let alertTimer = null;

async function checkAlerts() {
  try {
    const activeAlerts = await query('SELECT * FROM price_alerts WHERE status = ?', ['active']);
    if (activeAlerts.length === 0) return;

    for (const alert of activeAlerts) {
      const tick = marketData.getPrice(alert.symbol);
      if (!tick) continue;

      let triggered = false;
      const currentPrice = tick.bid;

      switch (alert.alert_type) {
        case 'price_above':
          triggered = currentPrice >= parseFloat(alert.target_value);
          break;
        case 'price_below':
          triggered = currentPrice <= parseFloat(alert.target_value);
          break;
        case 'change_percent':
          triggered = Math.abs(tick.change_percent) >= parseFloat(alert.target_value);
          break;
      }

      if (triggered) {
        await triggerAlert(alert, currentPrice);
      }
    }
  } catch (err) {
    console.error(`[AlertService] 检查预警失败: ${err.message}`);
  }
}

async function triggerAlert(alert, currentPrice) {
  try {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    await query(
      'UPDATE price_alerts SET status = ?, triggered_at = ?, triggered_price = ? WHERE id = ?',
      ['triggered', now, currentPrice, alert.id]
    );

    await executeNotification(alert, currentPrice);

    console.log(`[AlertService] 预警已触发: ${alert.symbol} ${alert.alert_type} ${alert.target_value} -> 当前价 ${currentPrice}`);
  } catch (err) {
    console.error(`[AlertService] 触发预警失败 [${alert.id}]: ${err.message}`);
  }
}

async function executeNotification(alert, currentPrice) {
  const typeLabels = { price_above: '价格高于', price_below: '价格低于', change_percent: '涨跌幅达' };
  const message = `${alert.symbol} ${typeLabels[alert.alert_type] || alert.alert_type} ${alert.target_value}，当前价格 ${currentPrice}`;

  if (alert.notify_method === 'email') {
    try {
      const emailService = require('./emailService');
      const user = await query('SELECT email FROM users WHERE id = ?', [alert.user_id]);
      if (user.length > 0 && user[0].email) {
        await emailService.sendMail({
          to: user[0].email,
          subject: `价格预警 - ${alert.symbol}`,
          html: `<h3>价格预警触发</h3><p>${message}</p><p>触发时间: ${new Date().toLocaleString()}</p>`,
        });
      }
    } catch (err) {
      console.warn(`[AlertService] 邮件通知失败: ${err.message}`);
    }
  }

  console.log(`[AlertService] 通知[${alert.notify_method}]: ${message}`);
}

function startAlertService() {
  if (alertTimer) return;
  alertTimer = setInterval(checkAlerts, CHECK_INTERVAL_MS);
  console.log('[AlertService] 预警扫描服务已启动');
}

function stopAlertService() {
  if (alertTimer) { clearInterval(alertTimer); alertTimer = null; }
}

module.exports = { startAlertService, stopAlertService };
