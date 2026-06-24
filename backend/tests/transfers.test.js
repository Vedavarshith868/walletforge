const {
  request,
  app,
  pool,
  resetDatabase,
  closeDatabase,
  createOrganization,
  authHeader,
  createAccount,
  fundAccount,
} = require('./helpers');
const { sweepExpiredPending } = require('../src/lib/sweeper');

let token;

beforeEach(async () => {
  await resetDatabase();
  const { response } = await createOrganization({ slug: 'transfers-co' });
  token = response.body.token;
});

afterAll(closeDatabase);

async function balanceOf(accountId) {
  const response = await request(app).get(`/accounts/${accountId}`).set(authHeader(token));
  return response.body.account;
}

async function tenantBalanceSum() {
  const response = await request(app).get('/accounts').set(authHeader(token));
  return response.body.accounts.reduce((total, account) => total + account.balance, 0);
}

describe('immediate transfers', () => {
  test('moves money and keeps the ledger balanced', async () => {
    const cash = await createAccount(token, 'Cash', 'asset');
    const savings = await createAccount(token, 'Savings', 'asset');
    await fundAccount(token, cash.id, 10000);

    const transfer = await request(app)
      .post('/transfers')
      .set(authHeader(token))
      .send({ sourceAccountId: cash.id, destinationAccountId: savings.id, amount: 4000 });

    expect(transfer.status).toBe(201);
    expect(transfer.body.transfer.status).toBe('posted');
    expect((await balanceOf(cash.id)).balance).toBe(6000);
    expect((await balanceOf(savings.id)).balance).toBe(4000);
    expect(await tenantBalanceSum()).toBe(0);
  });

  test('rejects an overdraft from an asset account', async () => {
    const cash = await createAccount(token, 'Cash', 'asset');
    const savings = await createAccount(token, 'Savings', 'asset');
    await fundAccount(token, cash.id, 1000);

    const transfer = await request(app)
      .post('/transfers')
      .set(authHeader(token))
      .send({ sourceAccountId: cash.id, destinationAccountId: savings.id, amount: 5000 });

    expect(transfer.status).toBe(422);
    expect(transfer.body.error.code).toBe('insufficient_funds');
    expect((await balanceOf(cash.id)).balance).toBe(1000);
  });

  test('replays an idempotent request without double-applying it', async () => {
    const cash = await createAccount(token, 'Cash', 'asset');
    const savings = await createAccount(token, 'Savings', 'asset');
    await fundAccount(token, cash.id, 10000);

    const key = '11111111-1111-1111-1111-111111111111';
    const body = { sourceAccountId: cash.id, destinationAccountId: savings.id, amount: 3000 };

    const first = await request(app).post('/transfers').set(authHeader(token)).set('Idempotency-Key', key).send(body);
    const second = await request(app).post('/transfers').set(authHeader(token)).set('Idempotency-Key', key).send(body);

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(second.body.transfer.id).toBe(first.body.transfer.id);
    expect((await balanceOf(cash.id)).balance).toBe(7000);
  });
});

describe('two-phase transfers', () => {
  test('reserves available balance while pending, then posts', async () => {
    const cash = await createAccount(token, 'Cash', 'asset');
    const savings = await createAccount(token, 'Savings', 'asset');
    await fundAccount(token, cash.id, 10000);

    const pending = await request(app)
      .post('/transfers/pending')
      .set(authHeader(token))
      .send({ sourceAccountId: cash.id, destinationAccountId: savings.id, amount: 6000 });
    expect(pending.status).toBe(201);
    expect(pending.body.transfer.status).toBe('pending');

    const reserved = await balanceOf(cash.id);
    expect(reserved.balance).toBe(10000);
    expect(reserved.availableBalance).toBe(4000);

    const overdraft = await request(app)
      .post('/transfers')
      .set(authHeader(token))
      .send({ sourceAccountId: cash.id, destinationAccountId: savings.id, amount: 5000 });
    expect(overdraft.status).toBe(422);

    const posted = await request(app).post(`/transfers/${pending.body.transfer.id}/post`).set(authHeader(token));
    expect(posted.status).toBe(200);
    expect(posted.body.transfer.status).toBe('posted');
    expect((await balanceOf(cash.id)).balance).toBe(4000);
    expect((await balanceOf(savings.id)).balance).toBe(6000);
  });

  test('voiding releases the reservation and cannot be re-posted', async () => {
    const cash = await createAccount(token, 'Cash', 'asset');
    const savings = await createAccount(token, 'Savings', 'asset');
    await fundAccount(token, cash.id, 10000);

    const pending = await request(app)
      .post('/transfers/pending')
      .set(authHeader(token))
      .send({ sourceAccountId: cash.id, destinationAccountId: savings.id, amount: 6000 });

    const voided = await request(app).post(`/transfers/${pending.body.transfer.id}/void`).set(authHeader(token));
    expect(voided.status).toBe(200);
    expect(voided.body.transfer.status).toBe('voided');
    expect((await balanceOf(cash.id)).availableBalance).toBe(10000);

    const repost = await request(app).post(`/transfers/${pending.body.transfer.id}/post`).set(authHeader(token));
    expect(repost.status).toBe(409);
    expect(repost.body.error.code).toBe('invalid_transfer_state');
  });

  test('the sweeper auto-voids pending transfers past their expiry', async () => {
    const cash = await createAccount(token, 'Cash', 'asset');
    const savings = await createAccount(token, 'Savings', 'asset');
    await fundAccount(token, cash.id, 10000);

    const pending = await request(app)
      .post('/transfers/pending')
      .set(authHeader(token))
      .send({ sourceAccountId: cash.id, destinationAccountId: savings.id, amount: 6000 });

    const voided = await sweepExpiredPending({ olderThanHours: 0 });
    expect(voided).toBeGreaterThanOrEqual(1);

    const after = await request(app).get(`/transfers/${pending.body.transfer.id}`).set(authHeader(token));
    expect(after.body.transfer.status).toBe('voided');
  });
});
