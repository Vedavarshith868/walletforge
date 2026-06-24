function serializeAccount(row, availableBalance) {
  const account = {
    id: row.id,
    name: row.name,
    type: row.type,
    balance: row.balance,
    createdAt: row.created_at,
  };
  if (availableBalance !== undefined) {
    account.availableBalance = availableBalance;
  }
  return account;
}

function serializeTransfer(row) {
  return {
    id: row.id,
    sourceAccountId: row.source_account_id,
    destinationAccountId: row.destination_account_id,
    amount: row.amount,
    status: row.status,
    idempotencyKey: row.idempotency_key || null,
    createdAt: row.created_at,
    postedAt: row.posted_at,
    voidedAt: row.voided_at,
  };
}

module.exports = { serializeAccount, serializeTransfer };
