import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { Button } from '../components/ui';
import {
  Logo,
  IconArrowRight,
  IconScale,
  IconClock,
  IconShield,
  IconBolt,
  IconTrendingUp,
} from '../components/icons';

const features = [
  {
    icon: <IconScale className="h-5 w-5" />,
    title: 'Double-entry integrity',
    body: 'Every transfer debits one account and credits another by the same amount. The ledger always sums to zero.',
  },
  {
    icon: <IconClock className="h-5 w-5" />,
    title: 'Two-phase transfers',
    body: 'Authorize now, capture later. Pending transfers reserve balance and auto-expire if never settled.',
  },
  {
    icon: <IconShield className="h-5 w-5" />,
    title: 'Tenant isolation',
    body: 'PostgreSQL row-level security enforces separation in the database — not just in application code.',
  },
  {
    icon: <IconBolt className="h-5 w-5" />,
    title: 'Idempotent by design',
    body: 'Every mutation takes an idempotency key, so retries never double-apply a payment.',
  },
];

const previewAccounts = [
  { name: 'Operating Cash', type: 'asset', amount: '6,060,090.00', tone: 'text-white' },
  { name: 'Treasury Reserve', type: 'asset', amount: '6,000,000.00', tone: 'text-white' },
  { name: 'Customer Deposits', type: 'liability', amount: '−4,090,090.00', tone: 'text-rose-400' },
];

export default function Landing() {
  const { session } = useAuth();

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="glow-orb left-[-10%] top-[-10%] h-[480px] w-[480px] bg-sky-500/20" />
      <div className="glow-orb right-[-5%] top-[10%] h-[420px] w-[420px] bg-indigo-600/20" />
      <div className="glow-orb bottom-[-15%] left-[30%] h-[520px] w-[520px] bg-blue-600/15" />

      <div className="relative mx-auto max-w-6xl px-6">
        <header className="flex items-center justify-between py-6">
          <div className="flex items-center gap-2.5">
            <Logo className="h-8 w-8" />
            <span className="text-lg font-semibold text-white">WalletForge</span>
          </div>
          <div className="flex items-center gap-2">
            {session ? (
              <Link to="/dashboard">
                <Button>Open app</Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost">Sign in</Button>
                </Link>
                <Link to="/signup-org">
                  <Button>Get started</Button>
                </Link>
              </>
            )}
          </div>
        </header>

        <section className="grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
              Multi-tenant double-entry ledger
            </span>
            <h1 className="mt-6 text-5xl font-semibold leading-[1.05] tracking-tight text-white sm:text-6xl">
              Money movement that always balances.
            </h1>
            <p className="mt-5 max-w-md text-lg text-slate-400">
              WalletForge is a payment ledger for modern teams — atomic transfers, reserved balances, and
              database-enforced isolation, exposed through a clean API and dashboard.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to={session ? '/dashboard' : '/signup-org'}>
                <Button className="px-5 py-2.5" icon={<IconArrowRight className="h-4 w-4" />}>
                  {session ? 'Open dashboard' : 'Get started free'}
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="secondary" className="px-5 py-2.5">
                  Sign in
                </Button>
              </Link>
            </div>
            <p className="mt-8 text-xs uppercase tracking-widest text-slate-600">
              PostgreSQL · Row-Level Security · SERIALIZABLE transfers
            </p>
          </div>

          <div className="relative">
            <div className="glow-orb inset-0 m-auto h-72 w-72 bg-sky-500/20" />
            <div className="glass-strong relative rounded-3xl p-6 shadow-glow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Total balance</p>
                  <p className="mt-1 text-3xl font-semibold tabular-nums text-white">$14,090,090.00</p>
                  <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-300 ring-1 ring-emerald-400/20">
                    <IconTrendingUp className="h-3.5 w-3.5" /> +12.4% this year
                  </span>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-sky-300">
                  <IconScale className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-6 space-y-2.5">
                {previewAccounts.map((account) => (
                  <div
                    key={account.name}
                    className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                          account.type === 'asset' ? 'bg-sky-500/10 text-sky-300' : 'bg-violet-500/10 text-violet-300'
                        }`}
                      >
                        <IconScale className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-medium text-white">{account.name}</p>
                        <p className="text-xs capitalize text-slate-500">{account.type}</p>
                      </div>
                    </div>
                    <span className={`font-mono text-sm tabular-nums ${account.tone}`}>{account.amount}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between rounded-xl bg-emerald-500/5 px-4 py-3 text-sm">
                <span className="text-slate-400">Net position</span>
                <span className="font-medium text-emerald-300">Balanced · 0.00</span>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-white/5 py-16">
          <p className="text-center text-xs font-medium uppercase tracking-widest text-slate-500">Built for correctness</p>
          <h2 className="mx-auto mt-3 max-w-2xl text-center text-3xl font-semibold tracking-tight text-white">
            The guarantees a ledger needs, by default.
          </h2>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div key={feature.title} className="glass rounded-2xl p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-300">
                  {feature.icon}
                </div>
                <h3 className="mt-4 font-semibold text-white">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{feature.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-12">
          <div className="glass-strong relative overflow-hidden rounded-3xl px-8 py-12 text-center">
            <div className="glow-orb left-1/2 top-0 h-64 w-64 -translate-x-1/2 bg-indigo-500/20" />
            <div className="relative">
              <h2 className="text-3xl font-semibold tracking-tight text-white">Spin up a ledger in seconds.</h2>
              <p className="mx-auto mt-3 max-w-md text-slate-400">
                Create an organization, generate a sample ledger with one click, and explore real double-entry
                transfers.
              </p>
              <div className="mt-7 flex justify-center">
                <Link to={session ? '/dashboard' : '/signup-org'}>
                  <Button className="px-6 py-2.5" icon={<IconArrowRight className="h-4 w-4" />}>
                    {session ? 'Open dashboard' : 'Create your organization'}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <footer className="flex flex-col items-center justify-between gap-4 border-t border-white/5 py-8 text-sm text-slate-500 sm:flex-row">
          <div className="flex items-center gap-2">
            <Logo className="h-6 w-6" />
            <span>WalletForge</span>
          </div>
          <span>A double-entry payment ledger.</span>
        </footer>
      </div>
    </div>
  );
}
