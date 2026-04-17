class ApiResponse {
  static success(res, data = null, msg = '操作成功', code = 200) {
    return res.status(code === 201 ? 201 : 200).json({ code, msg, data });
  }

  static created(res, data = null, msg = '创建成功') {
    return res.status(201).json({ code: 201, msg, data });
  }

  static error(res, msg = '操作失败', code = 500, data = null) {
    const httpStatus = code >= 100 && code < 600 ? code : 500;
    return res.status(httpStatus).json({ code, msg, data });
  }

  static badRequest(res, msg = '请求参数错误', data = null) {
    return res.status(400).json({ code: 400, msg, data });
  }

  static unauthorized(res, msg = '未授权，请先登录') {
    return res.status(401).json({ code: 401, msg, data: null });
  }

  static forbidden(res, msg = '权限不足') {
    return res.status(403).json({ code: 403, msg, data: null });
  }

  static notFound(res, msg = '资源不存在') {
    return res.status(404).json({ code: 404, msg, data: null });
  }

  static paginate(res, { list, total, page, pageSize }) {
    return res.status(200).json({
      code: 200,
      msg: '操作成功',
      data: {
        list,
        pagination: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
      },
    });
  }
}

module.exports = ApiResponse;
