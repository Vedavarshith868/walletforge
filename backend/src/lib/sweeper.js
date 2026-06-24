const { pool, withTenant } = require('../db');

const SWEEP_INTERVAL_MS = Number(process.env.SWEEP_INTERVAL_MS || 60000);

async function sweepExpiredPending({ olderThanHours = 24 } = {}) {
  const tenants = (await pool.query('select id from organizations')).rows;
  let voided = 0;

  for (const tenant of tenants) {
    voided += await withTenant(tenant.id, async (client) => {
      const expired = await client.query(
        `update transfers set status = 'voided', voided_at = now()
         where status = 'pending' and created_at < now() - make_interval(hours => $1)
         returning id`,
        [olderThanHours]
      );
      for (const row of expired.rows) {
        await client.query(
          "insert into audit_log (tenant_id, event_type, event_data) values ($1, 'transfer.auto_voided', $2)",
          [tenant.id, { transfer_id: row.id, reason: 'expired' }]
        );
      }
      return expired.rowCount;
    });
  }

  return voided;
}

function startSweeper() {
  const run = () => {
    sweepExpiredPending().catch((error) => console.error('sweeper error:', error.message));
  };
  run();
  const timer = setInterval(run, SWEEP_INTERVAL_MS);
  if (timer.unref) timer.unref();
  return timer;
}

module.exports = { sweepExpiredPending, startSweeper };
