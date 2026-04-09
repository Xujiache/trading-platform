import { prisma } from '../../config/database';
import { redis } from '../../config/redis';
import { NotFoundError } from '../../utils/errors';

/**
 * 在线客服业务逻辑
 * 管理客服会话、消息记录等
 */
export class ChatService {
  /**
   * 创建或获取现有客服会话
   * @param userId - 用户 ID
   * @returns 会话信息
   */
  static async getOrCreateSession(userId: number) {
    const existing = await prisma.chatSession.findFirst({
      where: { userId, status: { in: ['waiting', 'active'] } },
    });

    if (existing) return existing;

    return prisma.chatSession.create({
      data: { userId, status: 'waiting' },
    });
  }

  /**
   * 获取会话消息列表
   * @param sessionId - 会话 ID
   * @param page - 页码
   * @param limit - 每页数量
   * @returns 消息列表和总数
   */
  static async getMessages(sessionId: number, page: number, limit: number) {
    const [list, total] = await Promise.all([
      prisma.chatMessage.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.chatMessage.count({ where: { sessionId } }),
    ]);

    return { list: list.reverse(), total };
  }

  /**
   * 保存聊天消息
   * @param data - 消息数据
   * @returns 创建的消息
   */
  static async saveMessage(data: {
    sessionId: number;
    senderId: number;
    senderType: 'user' | 'admin';
    content: string;
    type: 'text' | 'image';
  }) {
    return prisma.chatMessage.create({ data });
  }

  /**
   * 获取管理端会话列表
   * @param status - 状态筛选
   * @param page - 页码
   * @param limit - 每页数量
   * @returns 会话列表和总数
   */
  static async getSessionList(status?: string, page = 1, limit = 20) {
    const where = status ? { status } : {};

    const [list, total] = await Promise.all([
      prisma.chatSession.findMany({
        where,
        include: { user: { select: { id: true, nickname: true, avatar: true, phone: true } } },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.chatSession.count({ where }),
    ]);

    return { list, total };
  }

  /**
   * 管理员接单/分配会话
   * @param sessionId - 会话 ID
   * @param adminId - 管理员 ID
   * @returns 更新后的会话
   */
  static async assignSession(sessionId: number, adminId: number) {
    const session = await prisma.chatSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundError('会话不存在');

    return prisma.chatSession.update({
      where: { id: sessionId },
      data: { assignedTo: adminId, status: 'active' },
    });
  }

  /**
   * 关闭会话
   * @param sessionId - 会话 ID
   * @returns 更新后的会话
   */
  static async closeSession(sessionId: number) {
    const session = await prisma.chatSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundError('会话不存在');

    return prisma.chatSession.update({
      where: { id: sessionId },
      data: { status: 'closed', closedAt: new Date() },
    });
  }

  /**
   * 获取管理端未读消息数
   * @returns 未读消息数量
   */
  static async getUnreadCount() {
    return prisma.chatSession.count({
      where: { status: 'waiting' },
    });
  }
}
