const { request, app, resetDatabase, closeDatabase, createOrganization, authHeader, createAccount } = require('./helpers');

let token;

beforeEach(async () => {
  await resetDatabase();
  const { response } = await createOrganization({ slug: 'accounts-co' });
  token = response.body.token;
});

afterAll(closeDatabase);

describe('accounts', () => {
  test('creates an account that starts at a zero balance', async () => {
    const response = await request(app)
      .post('/accounts')
      .set(authHeader(token))
      .send({ name: 'Operating Cash', type: 'asset' });

    expect(response.status).toBe(201);
    expect(response.body.account).toMatchObject({ name: 'Operating Cash', type: 'asset', balance: 0 });
    expect(response.body.account.availableBalance).toBe(0);
  });

  test('validates the account type', async () => {
    const response = await request(app)
      .post('/accounts')
      .set(authHeader(token))
      .send({ name: 'Bad', type: 'equity' });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('invalid_request');
  });

  test('lists accounts for the tenant only', async () => {
    await createAccount(token, 'Cash', 'asset');
    await createAccount(token, 'Revenue', 'liability');

    const response = await request(app).get('/accounts').set(authHeader(token));
    expect(response.status).toBe(200);
    expect(response.body.accounts).toHaveLength(2);
  });

  test('returns 404 for an unknown account id', async () => {
    const response = await request(app)
      .get('/accounts/00000000-0000-0000-0000-000000000000')
      .set(authHeader(token));
    expect(response.status).toBe(404);
  });
});
