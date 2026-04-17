const jwt = require('jsonwebtoken');
const config = require('../config');
const ApiResponse = require('../utils/response');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return ApiResponse.unauthorized(res, '未提供访问令牌');
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return ApiResponse.unauthorized(res, '令牌已过期，请重新登录');
    }
    return ApiResponse.unauthorized(res, '无效的访问令牌');
  }
}

function authenticateAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return ApiResponse.unauthorized(res, '未提供访问令牌');
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    if (decoded.type !== 'admin') {
      return ApiResponse.forbidden(res, '需要管理员权限');
    }
    req.admin = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return ApiResponse.unauthorized(res, '令牌已过期，请重新登录');
    }
    return ApiResponse.unauthorized(res, '无效的访问令牌');
  }
}

function generateTokens(payload, type = 'user') {
  const tokenPayload = { ...payload, type };
  const accessToken = jwt.sign(tokenPayload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
  const refreshToken = jwt.sign(tokenPayload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });
  return { accessToken, refreshToken };
}

function verifyRefreshToken(token) {
  return jwt.verify(token, config.jwt.refreshSecret);
}

module.exports = {
  authenticateToken,
  authenticateAdmin,
  generateTokens,
  verifyRefreshToken,
};
