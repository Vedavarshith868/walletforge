import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Card, Field, Input, Select } from '../components/ui';
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
      const data = await call('/accounts', {
        method: 'POST',
        body: form,
        idempotencyKey: crypto.randomUUID(),
      });
      navigate(`/accounts/${data.account.id}`);
    } catch (requestError) {
      setError(requestError.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold">New account</h1>
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Name">
            <Input value={form.name} onChange={update('name')} placeholder="Operating Cash" required />
          </Field>
          <Field
            label="Type"
            hint="Asset accounts cannot go negative. Liability accounts can, which is how money enters the ledger."
          >
            <Select value={form.type} onChange={update('type')}>
              <option value="asset">Asset</option>
              <option value="liability">Liability</option>
            </Select>
          </Field>
          <Alert>{error}</Alert>
          <div className="flex gap-3">
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
