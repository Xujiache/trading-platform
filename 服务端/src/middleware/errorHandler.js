const ApiResponse = require('../utils/response');

function errorHandler(err, req, res, _next) {
  console.error(`[Error] ${err.message}`, err.stack);

  if (err.isOperational) {
    return ApiResponse.error(res, err.message, err.statusCode);
  }

  if (err.name === 'ValidationError' || err.type === 'entity.parse.failed') {
    return ApiResponse.badRequest(res, '请求参数格式错误');
  }

  if (err.code === 'ER_DUP_ENTRY') {
    return ApiResponse.badRequest(res, '数据已存在，请勿重复提交');
  }

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return ApiResponse.badRequest(res, '文件大小超出限制');
    }
    return ApiResponse.badRequest(res, `文件上传错误: ${err.message}`);
  }

  const message = process.env.NODE_ENV === 'development' ? err.message : '服务器内部错误';
  return ApiResponse.error(res, message, 500);
}

function notFoundHandler(req, res) {
  ApiResponse.notFound(res, `接口 ${req.method} ${req.originalUrl} 不存在`);
}

module.exports = { errorHandler, notFoundHandler };
