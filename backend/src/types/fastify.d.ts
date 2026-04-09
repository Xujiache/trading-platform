import 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    /** 移动端用户认证信息 */
    currentUser?: {
      id: number;
      type: 'mobile';
    };
    /** 管理端管理员认证信息 */
    currentAdmin?: {
      id: number;
      type: 'admin';
      roleId: number;
      permissions: string[];
    };
  }
}
