export async function createSampleLedger(call) {
  const newKey = () => crypto.randomUUID();

  const createAccount = (name, type) =>
    call('/accounts', { method: 'POST', idempotencyKey: newKey(), body: { name, type } }).then((data) => data.account);

  const transfer = (sourceAccountId, destinationAccountId, amount, path = '/transfers') =>
    call(path, { method: 'POST', idempotencyKey: newKey(), body: { sourceAccountId, destinationAccountId, amount } });

  const external = await createAccount('External Funding', 'liability');
  const operating = await createAccount('Operating Cash', 'asset');
  const reserve = await createAccount('Customer Reserve', 'asset');

  await transfer(external.id, operating.id, 500000);
  await transfer(operating.id, reserve.id, 150000);
  await transfer(operating.id, reserve.id, 50000, '/transfers/pending');
}
