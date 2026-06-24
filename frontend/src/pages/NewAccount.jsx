import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Alert, Button, Card, Field, Input, PageHeader, Select } from '../components/ui';
import { IconChevronLeft } from '../components/icons';
import { useApi } from '../lib/useApi';

export default function NewAccount() {
  const call = useApi();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', type: 'asset' });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const data = await call('/accounts', { method: 'POST', body: form, idempotencyKey: crypto.randomUUID() });
      navigate(`/accounts/${data.account.id}`);
    } catch (requestError) {
      setError(requestError.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        title="New account"
        subtitle="Accounts start at a zero balance and change only through balanced transfers."
        back={
          <Link to="/dashboard" className="mb-3 inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white">
            <IconChevronLeft className="h-4 w-4" /> Overview
          </Link>
        }
      />
      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label="Account name">
            <Input value={form.name} onChange={update('name')} placeholder="Operating Cash" required />
          </Field>
          <Field
            label="Type"
            hint="Asset accounts can never go negative. Liability accounts can — that is how money first enters the ledger."
          >
            <Select value={form.type} onChange={update('type')}>
              <option value="asset">Asset — holds money (e.g. Cash, Reserve)</option>
              <option value="liability">Liability — funds the ledger (e.g. External Funding)</option>
            </Select>
          </Field>
          <Alert>{error}</Alert>
          <div className="flex gap-3 pt-1">
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create account'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/dashboard')}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
