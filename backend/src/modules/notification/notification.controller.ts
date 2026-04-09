import { FastifyRequest, FastifyReply } from 'fastify';
import { success, paginate } from '../../utils/response';
import * as notifService from './notification.service';

export async function list(request: FastifyRequest, reply: FastifyReply) {
  const query = request.query as Record<string, string>;
  const result = await notifService.list(request.currentUser!.id, query);
  return paginate(reply, result.list, result.total, result.page, result.limit);
}

export async function markRead(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const result = await notifService.markRead(request.currentUser!.id, parseInt(id, 10));
  return success(reply, result);
}

export async function markAllRead(request: FastifyRequest, reply: FastifyReply) {
  const result = await notifService.markAllRead(request.currentUser!.id);
  return success(reply, result);
}

export async function getUnreadCount(request: FastifyRequest, reply: FastifyReply) {
  const result = await notifService.getUnreadCount(request.currentUser!.id);
  return success(reply, result);
}

export async function adminList(request: FastifyRequest, reply: FastifyReply) {
  const query = request.query as Record<string, string>;
  const result = await notifService.adminList(query);
  return paginate(reply, result.list, result.total, result.page, result.limit);
}

export async function adminSend(request: FastifyRequest, reply: FastifyReply) {
  const body = request.body as { userId: number; type: string; title: string; content: string };
  const result = await notifService.send(body);
  return success(reply, result, '通知已发送', 201);
}
