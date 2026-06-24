import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Alert, Button, Card, EmptyState, Field, Loading, PageHeader, Select } from '../components/ui';
import { IconChevronLeft, IconWallet } from '../components/icons';
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
      setError('Enter a positive amount.');
      return;
    }
    if (form.sourceAccountId === form.destinationAccountId) {
      setError('Source and destination must be different accounts.');
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

  if (loading) return <Loading />;

  if (accounts.length < 2) {
    return (
      <div className="mx-auto max-w-xl">
        <PageHeader title="New transfer" />
        <EmptyState
          icon={<IconWallet className="h-6 w-6" />}
          title="You need at least two accounts"
          description="Create an asset account and a liability account first, then you can move money between them."
        >
          <Link to="/accounts/new">
            <Button>Create an account</Button>
          </Link>
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        title="New transfer"
        subtitle="Move money between two accounts. Every transfer debits one and credits the other."
        back={
          <Link to="/dashboard" className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
            <IconChevronLeft className="h-4 w-4" /> Overview
          </Link>
        }
      />
      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label="From">
            <Select value={form.sourceAccountId} onChange={update('sourceAccountId')} required>
              <option value="">Select source account</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} — {formatAmount(account.availableBalance)} available
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
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.amount}
              onChange={update('amount')}
              placeholder="0.00"
              required
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-right font-mono text-lg text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </Field>
          <Field label="Mode" hint="Pending reserves the source balance until you post or void it.">
            <Select value={form.mode} onChange={update('mode')}>
              <option value="immediate">Immediate — post now</option>
              <option value="pending">Two-phase — create as pending</option>
            </Select>
          </Field>
          <Alert>{error}</Alert>
          <div className="pt-1">
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Create transfer'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
