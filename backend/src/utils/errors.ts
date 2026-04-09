/**
 * 应用基础错误类，所有自定义错误继承此类
 * @param message - 错误消息
 * @param statusCode - HTTP 状态码
 * @param code - 业务错误码
 */
export class AppError extends Error {
  public statusCode: number;
  public code: number;

  constructor(message: string, statusCode = 400, code = 1) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

/** 401 未认证 */
export class UnauthorizedError extends AppError {
  constructor(message = '未登录或登录已过期') {
    super(message, 401, 1001);
    this.name = 'UnauthorizedError';
  }
}

/** 403 无权限 */
export class ForbiddenError extends AppError {
  constructor(message = '无操作权限') {
    super(message, 403, 1003);
    this.name = 'ForbiddenError';
  }
}

/** 404 未找到 */
export class NotFoundError extends AppError {
  constructor(message = '资源不存在') {
    super(message, 404, 1004);
    this.name = 'NotFoundError';
  }
}

/** 409 冲突（重复数据） */
export class ConflictError extends AppError {
  constructor(message = '数据已存在') {
    super(message, 409, 1009);
    this.name = 'ConflictError';
  }
}

/** 422 验证失败 */
export class ValidationError extends AppError {
  public errors: unknown[];
  constructor(message = '参数验证失败', errors: unknown[] = []) {
    super(message, 422, 1022);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

/** 429 请求过于频繁 */
export class TooManyRequestsError extends AppError {
  constructor(message = '请求过于频繁，请稍后再试') {
    super(message, 429, 1029);
    this.name = 'TooManyRequestsError';
  }
}

/** 500 服务器内部错误 */
export class InternalError extends AppError {
  constructor(message = '服务器内部错误') {
    super(message, 500, 5000);
    this.name = 'InternalError';
  }
}
