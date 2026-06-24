const { Pool, types } = require('pg');

types.setTypeParser(20, (value) => parseInt(value, 10));

const ssl = process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false;

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl });

async function checkoutTenantClient(tenantId) {
  const client = await pool.connect();
  try {
    await client.query("select set_config('app.tenant_id', $1, false)", [tenantId]);
    return client;
  } catch (error) {
    client.release();
    throw error;
  }
}

async function withTenant(tenantId, work) {
  const client = await pool.connect();
  try {
    await client.query('begin');
    await client.query("select set_config('app.tenant_id', $1, true)", [tenantId]);
    const result = await work(client);
    await client.query('commit');
    return result;
  } catch (error) {
    await client.query('rollback').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

async function inTransaction(client, work) {
  await client.query('begin');
  try {
    const result = await work();
    await client.query('commit');
    return result;
  } catch (error) {
    await client.query('rollback').catch(() => {});
    throw error;
  }
}

module.exports = { pool, checkoutTenantClient, withTenant, inTransaction };
