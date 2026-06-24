import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useInView } from '../lib/useInView';
import { Button } from '../components/ui';
import LiveLedgerCard from '../components/LiveLedgerCard';
import {
  Logo,
  IconArrowRight,
  IconScale,
  IconClock,
  IconShield,
  IconBolt,
  IconWallet,
  IconTransfers,
} from '../components/icons';

function Reveal({ children, delay = 0, className = '' }) {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      className={`reveal ${inView ? 'in-view' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

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

const steps = [
  {
    n: '01',
    icon: <IconWallet className="h-5 w-5" />,
    title: 'Open your accounts',
    body: 'Create asset accounts for the cash you hold and liability accounts for the money you owe — deposits, settlements, payouts.',
  },
  {
    n: '02',
    icon: <IconTransfers className="h-5 w-5" />,
    title: 'Move money',
    body: 'Post a transfer to move funds instantly, or authorize now and capture later with reserved balance and automatic expiry.',
  },
  {
    n: '03',
    icon: <IconScale className="h-5 w-5" />,
    title: 'Stay reconciled',
    body: 'Each posting is double-entry and runs at SERIALIZABLE isolation, so the books always reconcile — even under concurrent load.',
  },
];

export default function Landing() {
  const { session } = useAuth();
  const primaryTo = session ? '/dashboard' : '/signup-org';

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
                <Button className="whitespace-nowrap">Open dashboard</Button>
              </Link>
            ) : (
              <>
                <Link to="/login" className="hidden sm:block">
                  <Button variant="ghost" className="whitespace-nowrap">
                    Sign in
                  </Button>
                </Link>
                <Link to="/signup-org">
                  <Button className="whitespace-nowrap">Get started</Button>
                </Link>
              </>
            )}
          </div>
        </header>

        <section className="grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
          <div className="min-w-0 animate-rise">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
              Multi-tenant double-entry ledger
            </span>
            <h1 className="mt-6 text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Money movement that always balances.
            </h1>
            <p className="mt-5 max-w-md text-lg text-slate-400">
              WalletForge is a payment ledger for modern teams — atomic transfers, reserved balances, and
              database-enforced isolation, exposed through a clean API and dashboard.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to={primaryTo}>
                <Button className="whitespace-nowrap px-5 py-2.5" icon={<IconArrowRight className="h-4 w-4" />}>
                  {session ? 'Open dashboard' : 'Get started free'}
                </Button>
              </Link>
              {!session && (
                <Link to="/login">
                  <Button variant="secondary" className="whitespace-nowrap px-5 py-2.5">
                    Sign in
                  </Button>
                </Link>
              )}
            </div>
            <p className="mt-8 text-xs uppercase tracking-widest text-slate-600">
              PostgreSQL · Row-Level Security · SERIALIZABLE transfers
            </p>
          </div>

          <div className="min-w-0 animate-rise" style={{ animationDelay: '120ms' }}>
            <LiveLedgerCard />
            <p className="mt-3 text-center text-xs text-slate-600">
              Simulated activity — watch balances move while the ledger stays at zero.
            </p>
          </div>
        </section>

        <section className="py-16">
          <Reveal>
            <p className="text-center text-xs font-medium uppercase tracking-widest text-slate-500">How it works</p>
            <h2 className="mx-auto mt-3 max-w-2xl text-center text-3xl font-semibold tracking-tight text-white">
              From first account to a balanced ledger.
            </h2>
          </Reveal>
          <div className="relative mt-12 grid gap-4 md:grid-cols-3">
            <div className="pointer-events-none absolute left-0 right-0 top-9 hidden h-px bg-gradient-to-r from-transparent via-white/10 to-transparent md:block" />
            {steps.map((step, index) => (
              <Reveal key={step.n} delay={index * 110} className="h-full">
                <div className="glass relative h-full rounded-2xl p-6">
                  <div className="flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-300">
                      {step.icon}
                    </span>
                    <span className="font-mono text-sm text-slate-600">{step.n}</span>
                  </div>
                  <h3 className="mt-4 font-semibold text-white">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{step.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="border-t border-white/5 py-16">
          <Reveal>
            <p className="text-center text-xs font-medium uppercase tracking-widest text-slate-500">
              Built for correctness
            </p>
            <h2 className="mx-auto mt-3 max-w-2xl text-center text-3xl font-semibold tracking-tight text-white">
              The guarantees a ledger needs, by default.
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <Reveal key={feature.title} delay={index * 90} className="h-full">
                <div className="glass h-full rounded-2xl p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-300">
                    {feature.icon}
                  </div>
                  <h3 className="mt-4 font-semibold text-white">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{feature.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="py-12">
          <Reveal>
            <div className="glass-strong relative overflow-hidden rounded-3xl px-8 py-12 text-center">
              <div className="glow-orb left-1/2 top-0 h-64 w-64 -translate-x-1/2 bg-indigo-500/20" />
              <div className="relative">
                <h2 className="text-3xl font-semibold tracking-tight text-white">Spin up a ledger in seconds.</h2>
                <p className="mx-auto mt-3 max-w-md text-slate-400">
                  Create an organization, generate a sample ledger with one click, and explore real double-entry
                  transfers.
                </p>
                <div className="mt-7 flex justify-center">
                  <Link to={primaryTo}>
                    <Button className="px-6 py-2.5" icon={<IconArrowRight className="h-4 w-4" />}>
                      {session ? 'Open dashboard' : 'Create your organization'}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
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
