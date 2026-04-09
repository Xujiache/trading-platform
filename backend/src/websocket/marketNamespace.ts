import { Server, Socket } from 'socket.io';
import { marketEngine } from '../services/marketEngine';

/**
 * 行情推送命名空间 /market
 * 客户端连接后可订阅/取消订阅品种，服务端每秒推送实时行情
 * @param io - Socket.IO 服务器实例
 */
export function setupMarketNamespace(io: Server) {
  const marketNsp = io.of('/market');

  marketNsp.on('connection', (socket: Socket) => {
    console.log(`[Market WS] Client connected: ${socket.id}`);

    const subscribedSymbols = new Set<string>();

    socket.on('market:subscribe', (data: { symbols: string[] }) => {
      if (data?.symbols && Array.isArray(data.symbols)) {
        data.symbols.forEach((s) => {
          subscribedSymbols.add(s);
          socket.join(`symbol:${s}`);
        });
        console.log(`[Market WS] ${socket.id} subscribed: ${data.symbols.join(', ')}`);
      }
    });

    socket.on('market:unsubscribe', (data: { symbols: string[] }) => {
      if (data?.symbols && Array.isArray(data.symbols)) {
        data.symbols.forEach((s) => {
          subscribedSymbols.delete(s);
          socket.leave(`symbol:${s}`);
        });
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Market WS] Client disconnected: ${socket.id}`);
    });
  });

  marketEngine.onTick((tick) => {
    marketNsp.to(`symbol:${tick.symbol}`).emit('market:tick', tick);
  });

  console.log('[Market WS] /market namespace ready');
}
