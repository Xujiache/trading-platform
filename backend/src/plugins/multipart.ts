import multipart from '@fastify/multipart';
import { FastifyInstance } from 'fastify';
import { config } from '../config';

/**
 * 注册文件上传插件
 * @param app - Fastify 实例
 */
export async function registerMultipart(app: FastifyInstance) {
  await app.register(multipart, {
    limits: {
      fileSize: config.upload.maxSize,
      files: 5,
    },
  });
}
