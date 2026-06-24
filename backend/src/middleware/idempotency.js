async function idempotency(req, res, next) {
  const key = req.header('Idempotency-Key');
  if (!key) return next();

  const tenantId = req.auth.tenantId;

  let claimed;
  try {
    const result = await req.db.query(
      'insert into idempotency_keys (key, tenant_id) values ($1, $2) on conflict do nothing',
      [key, tenantId]
    );
    claimed = result.rowCount === 1;
  } catch (error) {
    return next(error);
  }

  if (!claimed) {
    let stored;
    try {
      stored = await req.db.query(
        'select response_body, status_code from idempotency_keys where key = $1 and tenant_id = $2',
        [key, tenantId]
      );
    } catch (error) {
      return next(error);
    }
    const row = stored.rows[0];
    if (row && row.status_code !== null) {
      return res.status(row.status_code).json(row.response_body);
    }
    return res.status(409).json({
      error: {
        code: 'idempotency_conflict',
        message: 'A request with this Idempotency-Key is already in progress',
      },
    });
  }

  const sendJson = res.json.bind(res);
  res.json = (body) => {
    const statusCode = res.statusCode || 200;
    const persist =
      statusCode >= 500
        ? req.db.query('delete from idempotency_keys where key = $1 and tenant_id = $2', [key, tenantId])
        : req.db.query(
            'update idempotency_keys set response_body = $1, status_code = $2 where key = $3 and tenant_id = $4',
            [body, statusCode, key, tenantId]
          );
    persist.catch(() => {}).finally(() => sendJson(body));
    return res;
  };

  next();
}

module.exports = idempotency;
