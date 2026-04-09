import { FastifyInstance } from 'fastify';
import { Server } from 'socket.io';
import { config } from '../config';

/**
 * 初始化 Socket.IO 服务并挂载到 Fastify 实例
 * @param app - Fastify 实例
 * @returns Socket.IO Server 实例
 */
export function initSocketIO(app: FastifyInstance): Server {
  const io = new Server(app.server, {
    cors: {
      origin: config.cors.origin,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  console.log('[Socket.IO] Initialized');
  return io;
}
