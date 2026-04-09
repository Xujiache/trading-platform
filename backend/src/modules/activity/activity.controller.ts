import { FastifyRequest, FastifyReply } from 'fastify';
import { success, paginate } from '../../utils/response';
import * as activityService from './activity.service';

export async function list(req: FastifyRequest, reply: FastifyReply) { const q = req.query as Record<string, unknown>; const r = await activityService.list(q); return paginate(reply, r.list, r.total, r.page, r.limit); }
export async function create(req: FastifyRequest, reply: FastifyReply) { return success(reply, await activityService.create(req.body as Record<string, unknown>), '创建成功', 201); }
export async function update(req: FastifyRequest, reply: FastifyReply) { const { id } = req.params as { id: string }; return success(reply, await activityService.update(parseInt(id, 10), req.body as Record<string, unknown>)); }
export async function remove(req: FastifyRequest, reply: FastifyReply) { const { id } = req.params as { id: string }; return success(reply, await activityService.remove(parseInt(id, 10))); }
export async function updateStatus(req: FastifyRequest, reply: FastifyReply) { const { id } = req.params as { id: string }; const { status } = req.body as { status: string }; return success(reply, await activityService.updateStatus(parseInt(id, 10), status)); }
export async function getStatistics(req: FastifyRequest, reply: FastifyReply) { const { id } = req.params as { id: string }; return success(reply, await activityService.getStatistics(parseInt(id, 10))); }
