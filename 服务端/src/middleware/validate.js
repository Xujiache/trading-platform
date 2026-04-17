const { validationResult } = require('express-validator');
const ApiResponse = require('../utils/response');

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map(e => e.msg);
    return ApiResponse.badRequest(res, messages[0], errors.array());
  }
  next();
}

module.exports = { validate };
