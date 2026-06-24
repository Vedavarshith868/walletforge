const { ApiError } = require('../middleware/errors');

const MAX_RETRIES = 3;

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function backoffDelay(attempt) {
  const base = 10 * 2 ** attempt;
  return base + Math.floor(Math.random() * base);
}

async function runSerializable(client, work) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      await client.query('begin isolation level serializable');
      const result = await work(client);
      await client.query('commit');
      return result;
    } catch (error) {
      await client.query('rollback').catch(() => {});
      if (error.code === '40001' && attempt < MAX_RETRIES) {
        await sleep(backoffDelay(attempt));
        continue;
      }
      throw error;
    }
  }
}

async function loadAccount(client, accountId) {
  const result = await client.query('select id, type, balance from accounts where id = $1', [accountId]);
  return result.rows[0] || null;
}

async function reservedOutgoing(client, accountId) {
  const result = await client.query(
    "select coalesce(sum(amount), 0) as reserved from transfers where source_account_id = $1 and status = 'pending'",
    [accountId]
  );
  return result.rows[0].reserved;
}

async function assertSufficientFunds(client, source, amount) {
  if (source.type !== 'asset') return;
  const reserved = await reservedOutgoing(client, source.id);
  if (source.balance - reserved < amount) {
    throw new ApiError(422, 'insufficient_funds', 'Source account has insufficient available balance');
  }
}

async function writeAudit(client, eventType, eventData) {
  await client.query(
    "insert into audit_log (tenant_id, event_type, event_data) values (current_setting('app.tenant_id')::uuid, $1, $2)",
    [eventType, eventData]
  );
}

async function loadEndpoints(client, sourceAccountId, destinationAccountId) {
  const source = await loadAccount(client, sourceAccountId);
  if (!source) throw new ApiError(404, 'account_not_found', 'Source account not found');
  const destination = await loadAccount(client, destinationAccountId);
  if (!destination) throw new ApiError(404, 'account_not_found', 'Destination account not found');
  return { source, destination };
}

function createImmediateTransfer(client, { sourceAccountId, destinationAccountId, amount, idempotencyKey }) {
  return runSerializable(client, async (tx) => {
    const { source } = await loadEndpoints(tx, sourceAccountId, destinationAccountId);
    await assertSufficientFunds(tx, source, amount);

    await tx.query('update accounts set balance = balance - $1 where id = $2', [amount, sourceAccountId]);
    await tx.query('update accounts set balance = balance + $1 where id = $2', [amount, destinationAccountId]);

    const transfer = (
      await tx.query(
        `insert into transfers
           (tenant_id, source_account_id, destination_account_id, amount, status, idempotency_key, posted_at)
         values (current_setting('app.tenant_id')::uuid, $1, $2, $3, 'posted', $4, now())
         returning *`,
        [sourceAccountId, destinationAccountId, amount, idempotencyKey]
      )
    ).rows[0];

    await writeAudit(tx, 'transfer.posted', {
      transfer_id: transfer.id,
      amount,
      source_account_id: sourceAccountId,
      destination_account_id: destinationAccountId,
      mode: 'immediate',
    });

    return transfer;
  });
}

function createPendingTransfer(client, { sourceAccountId, destinationAccountId, amount, idempotencyKey }) {
  return runSerializable(client, async (tx) => {
    const { source } = await loadEndpoints(tx, sourceAccountId, destinationAccountId);
    await assertSufficientFunds(tx, source, amount);

    const transfer = (
      await tx.query(
        `insert into transfers
           (tenant_id, source_account_id, destination_account_id, amount, status, idempotency_key)
         values (current_setting('app.tenant_id')::uuid, $1, $2, $3, 'pending', $4)
         returning *`,
        [sourceAccountId, destinationAccountId, amount, idempotencyKey]
      )
    ).rows[0];

    await writeAudit(tx, 'transfer.created_pending', {
      transfer_id: transfer.id,
      amount,
      source_account_id: sourceAccountId,
      destination_account_id: destinationAccountId,
    });

    return transfer;
  });
}

function postTransfer(client, transferId) {
  return runSerializable(client, async (tx) => {
    const transfer = (await tx.query('select * from transfers where id = $1', [transferId])).rows[0];
    if (!transfer) throw new ApiError(404, 'transfer_not_found', 'Transfer not found');
    if (transfer.status !== 'pending') {
      throw new ApiError(409, 'invalid_transfer_state', `Cannot post a transfer with status '${transfer.status}'`);
    }

    const source = await loadAccount(tx, transfer.source_account_id);
    if (source.type === 'asset' && source.balance - transfer.amount < 0) {
      throw new ApiError(422, 'insufficient_funds', 'Source account has insufficient balance to post');
    }

    await tx.query('update accounts set balance = balance - $1 where id = $2', [
      transfer.amount,
      transfer.source_account_id,
    ]);
    await tx.query('update accounts set balance = balance + $1 where id = $2', [
      transfer.amount,
      transfer.destination_account_id,
    ]);

    const posted = (
      await tx.query("update transfers set status = 'posted', posted_at = now() where id = $1 returning *", [
        transferId,
      ])
    ).rows[0];

    await writeAudit(tx, 'transfer.posted', {
      transfer_id: transferId,
      amount: transfer.amount,
      mode: 'two_phase',
    });

    return posted;
  });
}

function voidTransfer(client, transferId, reason = 'manual') {
  return runSerializable(client, async (tx) => {
    const transfer = (await tx.query('select * from transfers where id = $1', [transferId])).rows[0];
    if (!transfer) throw new ApiError(404, 'transfer_not_found', 'Transfer not found');
    if (transfer.status !== 'pending') {
      throw new ApiError(409, 'invalid_transfer_state', `Cannot void a transfer with status '${transfer.status}'`);
    }

    const voided = (
      await tx.query("update transfers set status = 'voided', voided_at = now() where id = $1 returning *", [
        transferId,
      ])
    ).rows[0];

    await writeAudit(tx, 'transfer.voided', { transfer_id: transferId, reason });

    return voided;
  });
}

module.exports = { createImmediateTransfer, createPendingTransfer, postTransfer, voidTransfer };
