const { ApiError } = require('../middleware/errors');

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function asString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ApiError(400, 'invalid_request', `${field} is required`);
  }
  return value.trim();
}

function asEmail(value, field) {
  const text = asString(value, field);
  if (!EMAIL_PATTERN.test(text)) {
    throw new ApiError(400, 'invalid_request', `${field} must be a valid email address`);
  }
  return text.toLowerCase();
}

function asEnum(value, field, allowed) {
  const text = asString(value, field);
  if (!allowed.includes(text)) {
    throw new ApiError(400, 'invalid_request', `${field} must be one of: ${allowed.join(', ')}`);
  }
  return text;
}

function asUuid(value, field) {
  const text = asString(value, field);
  if (!UUID_PATTERN.test(text)) {
    throw new ApiError(400, 'invalid_request', `${field} must be a valid id`);
  }
  return text;
}

function asPositiveInteger(value, field) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new ApiError(400, 'invalid_request', `${field} must be a positive integer (minor units)`);
  }
  return value;
}

function parsePagination(query) {
  let limit = Number.parseInt(query.limit, 10);
  if (!Number.isInteger(limit) || limit <= 0) limit = 20;
  if (limit > 100) limit = 100;

  let offset = Number.parseInt(query.offset, 10);
  if (!Number.isInteger(offset) || offset < 0) offset = 0;

  return { limit, offset };
}

module.exports = { asString, asEmail, asEnum, asUuid, asPositiveInteger, parsePagination };
