import { Server, Socket } from 'socket.io';
import { ChatService } from '../modules/chat/chat.service';
import { verifyToken } from '../utils/crypto';

/**
 * /chat 命名空间 — 在线客服 WebSocket
 * 处理实时聊天消息收发、会话状态更新
 * @param io - Socket.IO 服务器实例
 */
export function setupChatNamespace(io: Server) {
  const chatNsp = io.of('/chat');

  chatNsp.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token as string;
      const type = (socket.handshake.auth.type as 'mobile' | 'admin') || 'mobile';

      if (!token) {
        return next(new Error('未提供认证 Token'));
      }

      const payload = await verifyToken(token, type);
      socket.data.userId = payload.id;
      socket.data.userType = type;
      next();
    } catch {
      next(new Error('认证失败'));
    }
  });

  chatNsp.on('connection', (socket: Socket) => {
    console.log(`[Chat] ${socket.data.userType} user ${socket.data.userId} connected`);

    socket.on('chat:join', async (data: { sessionId: number }) => {
      socket.join(`session:${data.sessionId}`);
    });

    socket.on('chat:send', async (data: { sessionId: number; content: string; type: 'text' | 'image' }) => {
      try {
        const message = await ChatService.saveMessage({
          sessionId: data.sessionId,
          senderId: socket.data.userId,
          senderType: socket.data.userType,
          content: data.content,
          type: data.type || 'text',
        });

        chatNsp.to(`session:${data.sessionId}`).emit('chat:message', {
          sessionId: data.sessionId,
          senderId: socket.data.userId,
          senderType: socket.data.userType,
          content: data.content,
          type: data.type || 'text',
          timestamp: message.createdAt,
        });
      } catch (err) {
        socket.emit('chat:error', { message: '发送消息失败' });
      }
    });

    socket.on('chat:typing', (data: { sessionId: number }) => {
      socket.to(`session:${data.sessionId}`).emit('chat:typing', {
        sessionId: data.sessionId,
        userId: socket.data.userId,
        userType: socket.data.userType,
      });
    });

    socket.on('disconnect', () => {
      console.log(`[Chat] ${socket.data.userType} user ${socket.data.userId} disconnected`);
    });
  });

  console.log('[WebSocket] Chat namespace initialized');
}
