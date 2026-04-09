import { beforeAll, afterAll } from 'vitest';
import { buildApp } from '../src/app';
import type { FastifyInstance } from 'fastify';

/**
 * Vitest 测试环境配置
 * 在所有测试前启动应用实例，测试后关闭
 */
let app: FastifyInstance;

beforeAll(async () => {
  app = await buildApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

export { app };
