import { FastifyRequest, FastifyReply } from 'fastify';
import { success, paginate } from '../../utils/response';
import * as ticketService from './ticket.service';

// 用户端工单
export async function userList(req: FastifyRequest, reply: FastifyReply) { return success(reply, await ticketService.userListTickets(req.currentUser!.id)); }
export async function create(req: FastifyRequest, reply: FastifyReply) { return success(reply, await ticketService.createTicket(req.currentUser!.id, req.body as Record<string, unknown>), '工单已提交', 201); }
export async function detail(req: FastifyRequest, reply: FastifyReply) { const { id } = req.params as { id: string }; return success(reply, await ticketService.getTicketDetail(req.currentUser!.id, parseInt(id, 10))); }
export async function userReply(req: FastifyRequest, reply: FastifyReply) { const { id } = req.params as { id: string }; const { content } = req.body as { content: string }; return success(reply, await ticketService.replyTicket(req.currentUser!.id, parseInt(id, 10), content)); }

// 管理端工单
export async function adminList(req: FastifyRequest, reply: FastifyReply) { const q = req.query as Record<string, unknown>; const r = await ticketService.adminListTickets(q); return paginate(reply, r.list, r.total, r.page, r.limit); }
export async function adminReply(req: FastifyRequest, reply: FastifyReply) { const { id } = req.params as { id: string }; const { content } = req.body as { content: string }; return success(reply, await ticketService.adminReplyTicket(parseInt(id, 10), req.currentAdmin!.id, content)); }
export async function closeTicket(req: FastifyRequest, reply: FastifyReply) { const { id } = req.params as { id: string }; return success(reply, await ticketService.closeTicket(parseInt(id, 10))); }
export async function assignTicket(req: FastifyRequest, reply: FastifyReply) { const { id } = req.params as { id: string }; const { assignedTo } = req.body as { assignedTo: number }; return success(reply, await ticketService.assignTicket(parseInt(id, 10), assignedTo)); }

// 帮助文档
export async function helpList(req: FastifyRequest, reply: FastifyReply) { const q = req.query as Record<string, string>; return success(reply, await ticketService.listHelpArticles(q)); }
export async function adminHelpList(req: FastifyRequest, reply: FastifyReply) { return success(reply, await ticketService.adminListHelp()); }
export async function createHelp(req: FastifyRequest, reply: FastifyReply) { return success(reply, await ticketService.createHelp(req.body as Record<string, unknown>), '创建成功', 201); }
export async function updateHelp(req: FastifyRequest, reply: FastifyReply) { const { id } = req.params as { id: string }; return success(reply, await ticketService.updateHelp(parseInt(id, 10), req.body as Record<string, unknown>)); }
export async function deleteHelp(req: FastifyRequest, reply: FastifyReply) { const { id } = req.params as { id: string }; return success(reply, await ticketService.deleteHelp(parseInt(id, 10))); }

// 公告
export async function announcementList(req: FastifyRequest, reply: FastifyReply) { const q = req.query as Record<string, unknown>; const r = await ticketService.listAnnouncements(q); return paginate(reply, r.list, r.total, r.page, r.limit); }
export async function adminAnnouncementList(req: FastifyRequest, reply: FastifyReply) { return success(reply, await ticketService.adminListAnnouncements()); }
export async function createAnnouncement(req: FastifyRequest, reply: FastifyReply) { return success(reply, await ticketService.createAnnouncement(req.body as Record<string, unknown>), '创建成功', 201); }
export async function updateAnnouncement(req: FastifyRequest, reply: FastifyReply) { const { id } = req.params as { id: string }; return success(reply, await ticketService.updateAnnouncement(parseInt(id, 10), req.body as Record<string, unknown>)); }
export async function deleteAnnouncement(req: FastifyRequest, reply: FastifyReply) { const { id } = req.params as { id: string }; return success(reply, await ticketService.deleteAnnouncement(parseInt(id, 10))); }
