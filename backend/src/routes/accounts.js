const express = require('express');
const { requireAuth } = require('../middleware/auth');
const idempotency = require('../middleware/idempotency');
const asyncHandler = require('../lib/asyncHandler');
const { inTransaction } = require('../db');
const { ApiError } = require('../middleware/errors');
const { asString, asEnum, asUuid, parsePagination } = require('../lib/validation');
const { serializeAccount, serializeTransfer } = require('../lib/serialize');

const router = express.Router();
router.use(requireAuth);

router.post(
  '/',
  idempotency,
  asyncHandler(async (req, res) => {
    const name = asString(req.body.name, 'name');
    const type = asEnum(req.body.type, 'type', ['asset', 'liability']);

    const account = await inTransaction(req.db, async () => {
      const created = (
        await req.db.query(
          "insert into accounts (tenant_id, name, type) values (current_setting('app.tenant_id')::uuid, $1, $2) returning *",
          [name, type]
        )
      ).rows[0];
      await req.db.query(
        "insert into audit_log (tenant_id, event_type, event_data) values (current_setting('app.tenant_id')::uuid, 'account.created', $1)",
        [{ account_id: created.id, name, type }]
      );
      return created;
    });

    res.status(201).json({ account: serializeAccount(account, account.balance) });
  })
);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const accounts = (
      await req.db.query(
        `select account.*, coalesce(reservation.reserved, 0) as reserved
         from accounts account
         left join (
           select source_account_id, sum(amount) as reserved
           from transfers
           where status = 'pending'
           group by source_account_id
         ) reservation on reservation.source_account_id = account.id
         order by account.created_at desc`
      )
    ).rows;

    res.json({
      accounts: accounts.map((row) => serializeAccount(row, row.balance - row.reserved)),
    });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = asUuid(req.params.id, 'id');
    const account = (
      await req.db.query(
        `select account.*, coalesce(reservation.reserved, 0) as reserved
         from accounts account
         left join (
           select source_account_id, sum(amount) as reserved
           from transfers
           where status = 'pending' and source_account_id = $1
           group by source_account_id
         ) reservation on reservation.source_account_id = account.id
         where account.id = $1`,
        [id]
      )
    ).rows[0];
    if (!account) throw new ApiError(404, 'account_not_found', 'Account not found');

    res.json({ account: serializeAccount(account, account.balance - account.reserved) });
  })
);

router.get(
  '/:id/history',
  asyncHandler(async (req, res) => {
    const id = asUuid(req.params.id, 'id');
    const exists = (await req.db.query('select id from accounts where id = $1', [id])).rows[0];
    if (!exists) throw new ApiError(404, 'account_not_found', 'Account not found');

    const { limit, offset } = parsePagination(req.query);
    const rows = (
      await req.db.query(
        `select *, case when source_account_id = $1 then 'outgoing' else 'incoming' end as direction
         from transfers
         where source_account_id = $1 or destination_account_id = $1
         order by created_at desc
         limit $2 offset $3`,
        [id, limit + 1, offset]
      )
    ).rows;

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    res.json({
      transfers: page.map((row) => ({ ...serializeTransfer(row), direction: row.direction })),
      limit,
      offset,
      hasMore,
    });
  })
);

module.exports = router;
