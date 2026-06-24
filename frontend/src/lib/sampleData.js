const ACCOUNTS = [
  { key: 'investor', name: 'Investor Capital', type: 'liability' },
  { key: 'deposits', name: 'Customer Deposits', type: 'liability' },
  { key: 'operating', name: 'Operating Cash', type: 'asset' },
  { key: 'treasury', name: 'Treasury Reserve', type: 'asset' },
  { key: 'stripe', name: 'Stripe Settlement', type: 'asset' },
  { key: 'payroll', name: 'Payroll Account', type: 'asset' },
];

const POSTED = [
  ['investor', 'operating', 1000000000],
  ['deposits', 'operating', 409009000],
  ['operating', 'treasury', 500000000],
  ['operating', 'stripe', 150000000],
  ['operating', 'payroll', 90000000],
  ['stripe', 'operating', 60000000],
  ['treasury', 'operating', 100000000],
  ['operating', 'payroll', 35000000],
  ['payroll', 'operating', 12000000],
  ['operating', 'treasury', 200000000],
];

const PENDING = [
  ['operating', 'stripe', 25000000],
  ['operating', 'payroll', 17500000],
  ['treasury', 'operating', 80000000],
];

export async function createSampleLedger(call) {
  const newKey = () => crypto.randomUUID();
  const ids = {};

  for (const account of ACCOUNTS) {
    const data = await call('/accounts', {
      method: 'POST',
      idempotencyKey: newKey(),
      body: { name: account.name, type: account.type },
    });
    ids[account.key] = data.account.id;
  }

  for (const [source, destination, amount] of POSTED) {
    await call('/transfers', {
      method: 'POST',
      idempotencyKey: newKey(),
      body: { sourceAccountId: ids[source], destinationAccountId: ids[destination], amount },
    });
  }

  for (const [source, destination, amount] of PENDING) {
    await call('/transfers/pending', {
      method: 'POST',
      idempotencyKey: newKey(),
      body: { sourceAccountId: ids[source], destinationAccountId: ids[destination], amount },
    });
  }
}
