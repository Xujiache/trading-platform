import { ref, onUnmounted } from 'vue';

/**
 * Socket.IO 封装 Composable
 * 管理 WebSocket 连接、事件监听和生命周期
 * @param namespace - 命名空间（如 '/market', '/chat'）
 */
export function useSocket(namespace: string) {
  const connected = ref(false);
  const socket = ref<any>(null);

  /**
   * 建立连接
   * @param token - JWT Token
   * @param type - 用户类型
   */
  function connect(token: string, type: 'mobile' | 'admin' = 'mobile') {
    if (socket.value?.connected) return;

    const { io } = require('socket.io-client');
    const BASE_URL = 'http://localhost:3000';

    socket.value = io(`${BASE_URL}${namespace}`, {
      auth: { token, type },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    socket.value.on('connect', () => {
      connected.value = true;
    });

    socket.value.on('disconnect', () => {
      connected.value = false;
    });
  }

  /**
   * 监听事件
   * @param event - 事件名
   * @param handler - 处理函数
   */
  function on(event: string, handler: (...args: any[]) => void) {
    socket.value?.on(event, handler);
  }

  /**
   * 发送事件
   * @param event - 事件名
   * @param data - 数据
   */
  function emit(event: string, data?: any) {
    socket.value?.emit(event, data);
  }

  /**
   * 断开连接
   */
  function disconnect() {
    socket.value?.disconnect();
    socket.value = null;
    connected.value = false;
  }

  onUnmounted(() => {
    disconnect();
  });

  return { socket, connected, connect, on, emit, disconnect };
}
