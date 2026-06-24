const { request, app, resetDatabase, closeDatabase, createOrganization, authHeader, createAccount } = require('./helpers');

beforeEach(resetDatabase);
afterAll(closeDatabase);

describe('authentication and tenant isolation', () => {
  test('signs up an organization and returns a scoped token', async () => {
    const { response } = await createOrganization({ slug: 'acme', email: 'owner@acme.test' });
    expect(response.status).toBe(201);
    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.organization.slug).toBe('acme');
    expect(response.body.user.email).toBe('owner@acme.test');
  });

  test('rejects a duplicate organization slug', async () => {
    await createOrganization({ slug: 'dupe' });
    const { response } = await createOrganization({ slug: 'dupe' });
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('organization_exists');
  });

  test('logs in an existing user and rejects a wrong password', async () => {
    const { payload } = await createOrganization({ slug: 'login-co', email: 'jordan@login.test' });

    const ok = await request(app)
      .post('/auth/login')
      .send({ slug: 'login-co', email: 'jordan@login.test', password: payload.password });
    expect(ok.status).toBe(200);
    expect(ok.body.token).toEqual(expect.any(String));

    const bad = await request(app)
      .post('/auth/login')
      .send({ slug: 'login-co', email: 'jordan@login.test', password: 'wrong' });
    expect(bad.status).toBe(401);
    expect(bad.body.error.code).toBe('invalid_credentials');
  });

  test('requires a bearer token for protected routes', async () => {
    const response = await request(app).get('/accounts');
    expect(response.status).toBe(401);
  });

  test('one tenant cannot read another tenant accounts', async () => {
    const first = await createOrganization({ slug: 'tenant-a' });
    const second = await createOrganization({ slug: 'tenant-b' });

    const account = await createAccount(first.response.body.token, 'A Cash', 'asset');

    const list = await request(app).get('/accounts').set(authHeader(second.response.body.token));
    expect(list.status).toBe(200);
    expect(list.body.accounts).toHaveLength(0);

    const direct = await request(app).get(`/accounts/${account.id}`).set(authHeader(second.response.body.token));
    expect(direct.status).toBe(404);
  });
});
