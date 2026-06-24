import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { Alert, Button, Field, Input } from '../components/ui';
import { useAuth } from '../lib/auth';
import { apiRequest } from '../lib/api';

export default function SignupOrg() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ organizationName: '', slug: '', email: '', password: '' });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const body = { ...form };
      if (!body.slug) delete body.slug;
      const data = await apiRequest('/auth/signup-org', { method: 'POST', body });
      signIn(data);
      navigate('/dashboard');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create an organization"
      subtitle="Start a new tenant and become its first user"
      footer={
        <span>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-slate-700 underline">
            Sign in
          </Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Organization name">
          <Input value={form.organizationName} onChange={update('organizationName')} placeholder="Acme Inc" required />
        </Field>
        <Field label="Slug" hint="Optional — derived from the name if left blank">
          <Input value={form.slug} onChange={update('slug')} placeholder="acme" />
        </Field>
        <Field label="Email">
          <Input type="email" value={form.email} onChange={update('email')} required />
        </Field>
        <Field label="Password">
          <Input type="password" value={form.password} onChange={update('password')} required />
        </Field>
        <Alert>{error}</Alert>
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Creating…' : 'Create organization'}
        </Button>
      </form>
    </AuthLayout>
  );
}
