import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Card, Field, Input, Select } from '../components/ui';
import { useApi } from '../lib/useApi';
import { useAccounts } from '../lib/useAccounts';
import { formatAmount, toMinorUnits } from '../lib/money';

export default function Transfer() {
  const call = useApi();
  const navigate = useNavigate();
  const { accounts, loading } = useAccounts();

  const [form, setForm] = useState({ sourceAccountId: '', destinationAccountId: '', amount: '', mode: 'immediate' });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const idempotencyKey = useRef(crypto.randomUUID());

  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    const amount = toMinorUnits(form.amount);
    if (!Number.isInteger(amount) || amount <= 0) {
      setError('Enter a positive amount');
      return;
    }
    if (form.sourceAccountId === form.destinationAccountId) {
      setError('Source and destination must differ');
      return;
    }

    setSubmitting(true);
    try {
      const path = form.mode === 'pending' ? '/transfers/pending' : '/transfers';
      const data = await call(path, {
        method: 'POST',
        idempotencyKey: idempotencyKey.current,
        body: {
          sourceAccountId: form.sourceAccountId,
          destinationAccountId: form.destinationAccountId,
          amount,
        },
      });
      navigate(`/transfers/${data.transfer.id}`);
    } catch (requestError) {
      setError(requestError.message);
      idempotencyKey.current = crypto.randomUUID();
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold">New transfer</h1>
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="From">
            <Select value={form.sourceAccountId} onChange={update('sourceAccountId')} required>
              <option value="">Select source account</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({formatAmount(account.availableBalance)} available)
                </option>
              ))}
            </Select>
          </Field>
          <Field label="To">
            <Select value={form.destinationAccountId} onChange={update('destinationAccountId')} required>
              <option value="">Select destination account</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Amount" hint="In major units, e.g. 100.50">
            <Input
              type="number"
              step="0.01"
              min="0"
              value={form.amount}
              onChange={update('amount')}
              placeholder="0.00"
              required
            />
          </Field>
          <Field label="Mode" hint="Pending reserves the source balance until you post or void it.">
            <Select value={form.mode} onChange={update('mode')}>
              <option value="immediate">Immediate (post now)</option>
              <option value="pending">Two-phase (pending)</option>
            </Select>
          </Field>
          <Alert>{error}</Alert>
          <Button type="submit" disabled={submitting || loading}>
            {submitting ? 'Submitting…' : 'Create transfer'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
