import { FastifyRequest, FastifyReply } from 'fastify';
import { success } from '../../utils/response';
import * as homepageService from './homepage.service';

export async function getBanners(req: FastifyRequest, reply: FastifyReply) { return success(reply, await homepageService.getBanners()); }
export async function getRewardCards(req: FastifyRequest, reply: FastifyReply) { return success(reply, await homepageService.getRewardCards()); }
export async function getAnnouncements(req: FastifyRequest, reply: FastifyReply) { return success(reply, await homepageService.getAnnouncements()); }
export async function getHotSymbols(req: FastifyRequest, reply: FastifyReply) { return success(reply, await homepageService.getHotSymbols()); }

// 管理端 Banner
export async function adminBannerList(req: FastifyRequest, reply: FastifyReply) { return success(reply, await homepageService.adminListBanners()); }
export async function createBanner(req: FastifyRequest, reply: FastifyReply) { return success(reply, await homepageService.createBanner(req.body as Record<string, unknown>), '创建成功', 201); }
export async function updateBanner(req: FastifyRequest, reply: FastifyReply) { const { id } = req.params as { id: string }; return success(reply, await homepageService.updateBanner(parseInt(id, 10), req.body as Record<string, unknown>)); }
export async function deleteBanner(req: FastifyRequest, reply: FastifyReply) { const { id } = req.params as { id: string }; return success(reply, await homepageService.deleteBanner(parseInt(id, 10))); }

// 管理端奖励卡片
export async function adminRewardCardList(req: FastifyRequest, reply: FastifyReply) { return success(reply, await homepageService.adminListRewardCards()); }
export async function createRewardCard(req: FastifyRequest, reply: FastifyReply) { return success(reply, await homepageService.createRewardCard(req.body as Record<string, unknown>), '创建成功', 201); }
export async function updateRewardCard(req: FastifyRequest, reply: FastifyReply) { const { id } = req.params as { id: string }; return success(reply, await homepageService.updateRewardCard(parseInt(id, 10), req.body as Record<string, unknown>)); }
export async function deleteRewardCard(req: FastifyRequest, reply: FastifyReply) { const { id } = req.params as { id: string }; return success(reply, await homepageService.deleteRewardCard(parseInt(id, 10))); }
