/**
 * Socket.IO 客户端配置
 * 提供行情和客服两个命名空间的连接管理
 */

const BASE_URL = 'http://localhost:3000';

interface SocketConfig {
  namespace: string;
  token: string;
  type?: 'mobile' | 'admin';
}

/**
 * 创建 Socket.IO 客户端连接
 * 注意：UniApp 环境需根据平台选择合适的 Socket 实现
 * H5 环境使用 socket.io-client，App 环境使用 uni.connectSocket
 * @param config - 连接配置
 * @returns Socket 实例
 */
export function createSocket(config: SocketConfig) {
  // #ifdef H5
  const { io } = require('socket.io-client');
  const socket = io(`${BASE_URL}${config.namespace}`, {
    auth: { token: config.token, type: config.type || 'mobile' },
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
  });
  return socket;
  // #endif

  // #ifndef H5
  console.warn('[Socket] 非 H5 环境暂不支持 Socket.IO，请使用 uni.connectSocket 替代方案');
  return null;
  // #endif
}

/**
 * 创建行情 Socket 连接
 * @param token - JWT Token
 */
export function createMarketSocket(token: string) {
  return createSocket({ namespace: '/market', token });
}

/**
 * 创建客服 Socket 连接
 * @param token - JWT Token
 */
export function createChatSocket(token: string) {
  return createSocket({ namespace: '/chat', token });
}
