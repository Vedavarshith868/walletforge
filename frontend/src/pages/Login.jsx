import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { Alert, Button, Field, Input } from '../components/ui';
import { useAuth } from '../lib/auth';
import { apiRequest } from '../lib/api';

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ slug: '', email: '', password: '' });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const data = await apiRequest('/auth/login', { method: 'POST', body: form });
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
      title="Sign in"
      subtitle="Access your organization's ledger"
      footer={
        <span>
          Need an account?{' '}
          <Link to="/signup" className="font-medium text-sky-300 underline hover:text-sky-200">
            Join an organization
          </Link>{' '}
          or{' '}
          <Link to="/signup-org" className="font-medium text-sky-300 underline hover:text-sky-200">
            create one
          </Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Organization slug">
          <Input value={form.slug} onChange={update('slug')} placeholder="acme" required />
        </Field>
        <Field label="Email">
          <Input type="email" value={form.email} onChange={update('email')} required />
        </Field>
        <Field label="Password">
          <Input type="password" value={form.password} onChange={update('password')} required />
        </Field>
        <Alert>{error}</Alert>
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </AuthLayout>
  );
}
