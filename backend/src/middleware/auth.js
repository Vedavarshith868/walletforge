const jwt = require('jsonwebtoken');
const { ApiError } = require('./errors');
const { checkoutTenantClient } = require('../db');

async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return next(new ApiError(401, 'unauthorized', 'Missing bearer token'));
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return next(new ApiError(401, 'unauthorized', 'Invalid or expired token'));
  }

  req.auth = { userId: payload.sub, tenantId: payload.tenant, email: payload.email };

  let client;
  try {
    client = await checkoutTenantClient(req.auth.tenantId);
  } catch (error) {
    return next(error);
  }
  req.db = client;

  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    client
      .query('reset app.tenant_id')
      .catch(() => {})
      .finally(() => client.release());
  };
  res.on('finish', release);
  res.on('close', release);

  next();
}

module.exports = { requireAuth };
