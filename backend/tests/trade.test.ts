import { describe, it, expect } from 'vitest';
import { buildApp } from '../src/app';

/**
 * 交易模块测试
 */
describe('Trade Module', () => {
  it('未认证下单应返回 401', async () => {
    const app = await buildApp();
    await app.ready();

    const response = await app.inject({
      method: 'POST',
      url: '/api/mobile/trade/order',
      payload: {
        symbolId: 1,
        direction: 'buy',
        orderType: 'market',
        lots: 0.01,
        leverage: 100,
      },
    });

    expect(response.statusCode).toBe(401);

    await app.close();
  });

  it('未认证获取持仓应返回 401', async () => {
    const app = await buildApp();
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/api/mobile/trade/positions',
    });

    expect(response.statusCode).toBe(401);

    await app.close();
  });

  it('未认证获取账户信息应返回 401', async () => {
    const app = await buildApp();
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/api/mobile/trade/account',
    });

    expect(response.statusCode).toBe(401);

    await app.close();
  });
});
