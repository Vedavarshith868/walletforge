import { Link } from 'react-router-dom';
import { Logo } from './icons';

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 flex-col justify-between bg-slate-900 p-12 text-white lg:flex">
        <Link to="/login" className="flex items-center gap-2.5">
          <Logo className="h-9 w-9" />
          <span className="text-xl font-semibold">WalletForge</span>
        </Link>
        <div>
          <h2 className="text-3xl font-semibold leading-snug">A double-entry ledger built for correctness.</h2>
          <p className="mt-4 max-w-md text-slate-300">
            Multi-tenant accounts and transfers with atomic postings, reserved balances, and database-enforced tenant
            isolation.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-slate-300">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" /> Every transfer balances to zero
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" /> Two-phase transfers with auto-expiry
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" /> Idempotent, tenant-isolated APIs
            </li>
          </ul>
        </div>
        <p className="text-xs text-slate-500">PostgreSQL · Row-Level Security · SERIALIZABLE transfers</p>
      </div>

      <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <Logo className="h-8 w-8" />
            <span className="text-lg font-semibold">WalletForge</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-6 text-center text-sm text-slate-500">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
