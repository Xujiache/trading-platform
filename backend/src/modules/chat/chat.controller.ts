import { FastifyRequest, FastifyReply } from 'fastify';
import { ChatService } from './chat.service';
import { getMessagesSchema, assignSessionSchema, sessionMessagesSchema } from './chat.schema';
import { success, paginate } from '../../utils/response';

/**
 * 客服模块控制器
 * 处理用户端和管理端的客服相关请求
 */
export class ChatController {
  /**
   * 用户端：创建/获取客服会话
   */
  static async createSession(request: FastifyRequest, reply: FastifyReply) {
    const session = await ChatService.getOrCreateSession(request.currentUser!.id);
    return success(reply, session);
  }

  /**
   * 用户端：获取历史消息
   */
  static async getMessages(request: FastifyRequest, reply: FastifyReply) {
    const { sessionId, page, limit } = getMessagesSchema.parse(request.query);
    const { list, total } = await ChatService.getMessages(sessionId, page, limit);
    return paginate(reply, list, total, page, limit);
  }

  /**
   * 管理端：获取会话列表
   */
  static async adminGetSessions(request: FastifyRequest, reply: FastifyReply) {
    const query = request.query as { status?: string; page?: string; limit?: string };
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '20');
    const { list, total } = await ChatService.getSessionList(query.status, page, limit);
    return paginate(reply, list, total, page, limit);
  }

  /**
   * 管理端：获取会话消息
   */
  static async adminGetMessages(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const { page, limit } = sessionMessagesSchema.parse(request.query);
    const { list, total } = await ChatService.getMessages(parseInt(id), page, limit);
    return paginate(reply, list, total, page, limit);
  }

  /**
   * 管理端：接单/分配会话
   */
  static async adminAssignSession(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const body = assignSessionSchema.parse(request.body);
    const adminId = body.adminId || request.currentAdmin!.id;
    const session = await ChatService.assignSession(parseInt(id), adminId);
    return success(reply, session);
  }

  /**
   * 管理端：关闭会话
   */
  static async adminCloseSession(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const session = await ChatService.closeSession(parseInt(id));
    return success(reply, session);
  }

  /**
   * 管理端：获取未读消息数
   */
  static async adminGetUnreadCount(request: FastifyRequest, reply: FastifyReply) {
    const count = await ChatService.getUnreadCount();
    return success(reply, { count });
  }
}
