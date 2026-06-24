const request = require('supertest');
const app = require('../src/index');
const { pool } = require('../src/db');

const TABLES = ['idempotency_keys', 'audit_log', 'transfers', 'accounts', 'users', 'organizations'];

async function resetDatabase() {
  await pool.query(`truncate ${TABLES.join(', ')} restart identity cascade`);
}

async function closeDatabase() {
  await pool.end();
}

let counter = 0;

async function createOrganization(overrides = {}) {
  counter += 1;
  const payload = {
    organizationName: overrides.organizationName || `Org ${counter}`,
    slug: overrides.slug || `org-${counter}-${Date.now()}`,
    email: overrides.email || `owner${counter}@example.com`,
    password: overrides.password || 'correct horse battery staple',
  };
  const response = await request(app).post('/auth/signup-org').send(payload);
  return { response, payload };
}

function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

async function createAccount(token, name, type) {
  const response = await request(app).post('/accounts').set(authHeader(token)).send({ name, type });
  return response.body.account;
}

async function fundAccount(token, assetAccountId, amount) {
  const liability = await createAccount(token, 'External Funding', 'liability');
  await request(app)
    .post('/transfers')
    .set(authHeader(token))
    .send({ sourceAccountId: liability.id, destinationAccountId: assetAccountId, amount });
  return liability;
}

module.exports = {
  app,
  request,
  pool,
  resetDatabase,
  closeDatabase,
  createOrganization,
  authHeader,
  createAccount,
  fundAccount,
};
