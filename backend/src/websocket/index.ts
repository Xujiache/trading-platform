import { Server } from 'socket.io';
import { setupMarketNamespace } from './marketNamespace';
import { setupChatNamespace } from './chatNamespace';

/**
 * 初始化所有 WebSocket 命名空间
 * @param io - Socket.IO 服务器实例
 */
export function setupWebSocket(io: Server) {
  setupMarketNamespace(io);
  setupChatNamespace(io);
  console.log('[WebSocket] All namespaces initialized');
}
