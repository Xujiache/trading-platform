import { describe, it, expect } from 'vitest';
import { buildApp } from '../src/app';

/**
 * 认证模块测试
 */
describe('Auth Module', () => {
  it('应返回健康检查响应', async () => {
    const app = await buildApp();
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.status).toBe('ok');

    await app.close();
  });

  it('未认证访问应返回 401', async () => {
    const app = await buildApp();
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/api/mobile/user/profile',
    });

    expect(response.statusCode).toBe(401);

    await app.close();
  });

  it('登录缺少参数应返回错误', async () => {
    const app = await buildApp();
    await app.ready();

    const response = await app.inject({
      method: 'POST',
      url: '/api/mobile/auth/login',
      payload: {},
    });

    expect(response.statusCode).toBeGreaterThanOrEqual(400);

    await app.close();
  });
});
