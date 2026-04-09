import { FastifyRequest, FastifyReply } from 'fastify';
import { success } from '../../utils/response';
import * as configService from './config.service';

export async function list(req: FastifyRequest, reply: FastifyReply) {
  const { category } = req.query as { category?: string };
  return success(reply, await configService.list(category));
}

export async function batchUpdate(req: FastifyRequest, reply: FastifyReply) {
  return success(reply, await configService.batchUpdate(req.body as Array<{ configKey: string; configValue: string }>));
}

export async function getSmtpConfig(req: FastifyRequest, reply: FastifyReply) {
  return success(reply, await configService.getSmtpConfig());
}

export async function updateSmtpConfig(req: FastifyRequest, reply: FastifyReply) {
  return success(reply, await configService.updateSmtpConfig(req.body as Array<{ configKey: string; configValue: string }>));
}
