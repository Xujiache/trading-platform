import cors from '@fastify/cors';
import { FastifyInstance } from 'fastify';
import { config } from '../config';

/**
 * 注册 CORS 跨域插件
 * @param app - Fastify 实例
 */
export async function registerCors(app: FastifyInstance) {
  await app.register(cors, {
    origin: config.cors.origin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
}
