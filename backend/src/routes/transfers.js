const express = require('express');
const { requireAuth } = require('../middleware/auth');
const idempotency = require('../middleware/idempotency');
const asyncHandler = require('../lib/asyncHandler');
const { ApiError } = require('../middleware/errors');
const { asUuid, asPositiveInteger, asEnum, parsePagination } = require('../lib/validation');
const { serializeTransfer } = require('../lib/serialize');
const engine = require('../lib/transfer');

const router = express.Router();
router.use(requireAuth);

function readTransferInput(body) {
  const sourceAccountId = asUuid(body.sourceAccountId, 'sourceAccountId');
  const destinationAccountId = asUuid(body.destinationAccountId, 'destinationAccountId');
  if (sourceAccountId === destinationAccountId) {
    throw new ApiError(422, 'invalid_transfer', 'Source and destination must be different accounts');
  }
  const amount = asPositiveInteger(body.amount, 'amount');
  return { sourceAccountId, destinationAccountId, amount };
}

router.post(
  '/',
  idempotency,
  asyncHandler(async (req, res) => {
    const input = readTransferInput(req.body);
    const transfer = await engine.createImmediateTransfer(req.db, {
      ...input,
      idempotencyKey: req.header('Idempotency-Key') || null,
    });
    res.status(201).json({ transfer: serializeTransfer(transfer) });
  })
);

router.post(
  '/pending',
  idempotency,
  asyncHandler(async (req, res) => {
    const input = readTransferInput(req.body);
    const transfer = await engine.createPendingTransfer(req.db, {
      ...input,
      idempotencyKey: req.header('Idempotency-Key') || null,
    });
    res.status(201).json({ transfer: serializeTransfer(transfer) });
  })
);

router.post(
  '/:id/post',
  idempotency,
  asyncHandler(async (req, res) => {
    const id = asUuid(req.params.id, 'id');
    const transfer = await engine.postTransfer(req.db, id);
    res.json({ transfer: serializeTransfer(transfer) });
  })
);

router.post(
  '/:id/void',
  idempotency,
  asyncHandler(async (req, res) => {
    const id = asUuid(req.params.id, 'id');
    const transfer = await engine.voidTransfer(req.db, id, 'manual');
    res.json({ transfer: serializeTransfer(transfer) });
  })
);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { limit, offset } = parsePagination(req.query);
    const conditions = ['true'];
    const params = [];

    if (req.query.status !== undefined) {
      const status = asEnum(req.query.status, 'status', ['pending', 'posted', 'voided']);
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }

    params.push(limit + 1, offset);
    const rows = (
      await req.db.query(
        `select * from transfers
         where ${conditions.join(' and ')}
         order by created_at desc
         limit $${params.length - 1} offset $${params.length}`,
        params
      )
    ).rows;

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    res.json({ transfers: page.map(serializeTransfer), limit, offset, hasMore });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = asUuid(req.params.id, 'id');
    const transfer = (await req.db.query('select * from transfers where id = $1', [id])).rows[0];
    if (!transfer) throw new ApiError(404, 'transfer_not_found', 'Transfer not found');
    res.json({ transfer: serializeTransfer(transfer) });
  })
);

module.exports = router;
