import { formatAmount } from '../lib/money';

const buttonVariants = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-500 disabled:bg-indigo-300',
  secondary: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50',
  danger: 'border border-rose-200 bg-white text-rose-600 hover:bg-rose-50 disabled:opacity-50',
  ghost: 'text-slate-600 hover:bg-slate-100 disabled:opacity-50',
};

export function Button({ variant = 'primary', className = '', icon, children, ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed ${buttonVariants[variant]} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}

export function Card({ className = '', padded = true, children }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white shadow-card ${padded ? 'p-6' : ''} ${className}`}>
      {children}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions, back }) {
  return (
    <div className="mb-6">
      {back}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

const statAccents = {
  slate: 'bg-slate-100 text-slate-500',
  emerald: 'bg-emerald-50 text-emerald-600',
  rose: 'bg-rose-50 text-rose-600',
  violet: 'bg-violet-50 text-violet-600',
  indigo: 'bg-indigo-50 text-indigo-600',
  amber: 'bg-amber-50 text-amber-600',
};

export function StatCard({ label, value, hint, icon, accent = 'slate' }) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${statAccents[accent]}`}>{icon}</span>
      </div>
      <div className="text-2xl font-semibold tabular-nums text-slate-900">{value}</div>
      {hint && <div className="text-xs text-slate-400">{hint}</div>}
    </Card>
  );
}

export function Table({ children }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

export function THead({ children }) {
  return (
    <thead>
      <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
        {children}
      </tr>
    </thead>
  );
}

export function Th({ children, className = '' }) {
  return <th className={`px-5 py-3 font-medium ${className}`}>{children}</th>;
}

export function TBody({ children }) {
  return <tbody>{children}</tbody>;
}

export function TR({ children, onClick, className = '' }) {
  return (
    <tr
      onClick={onClick}
      className={`border-b border-slate-100 last:border-0 ${onClick ? 'cursor-pointer hover:bg-slate-50' : ''} ${className}`}
    >
      {children}
    </tr>
  );
}

export function Td({ children, className = '' }) {
  return <td className={`px-5 py-3.5 text-slate-700 ${className}`}>{children}</td>;
}

export function EmptyState({ icon, title, description, children }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {description && <p className="mt-1.5 max-w-md text-sm text-slate-500">{description}</p>}
      {children && <div className="mt-6 flex flex-wrap items-center justify-center gap-3">{children}</div>}
    </div>
  );
}

const statusStyles = {
  pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  posted: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  voided: 'bg-slate-100 text-slate-500 ring-slate-500/20',
};

export function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${statusStyles[status] || ''}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
}

const typeStyles = {
  asset: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  liability: 'bg-violet-50 text-violet-700 ring-violet-600/20',
};

export function TypeBadge({ type }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${typeStyles[type] || ''}`}
    >
      {type}
    </span>
  );
}

export function Amount({ minor = 0, colored = false, showSign = false, className = '' }) {
  const negative = minor < 0;
  const text = formatAmount(Math.abs(minor));
  const prefix = negative ? '−' : showSign ? '+' : '';
  const color = colored ? (negative ? 'text-rose-600' : 'text-emerald-700') : '';
  return <span className={`tabular-nums ${color} ${className}`}>{`${prefix}${text}`}</span>;
}

export function Field({ label, hint, children }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
      {hint && <span className="block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

const controlClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20';

export function Input(props) {
  return <input className={controlClass} {...props} />;
}

export function Select(props) {
  return <select className={controlClass} {...props} />;
}

export function Alert({ children, variant = 'error' }) {
  if (!children) return null;
  const styles = {
    error: 'border-rose-200 bg-rose-50 text-rose-700',
    info: 'border-sky-200 bg-sky-50 text-sky-700',
  };
  return <div className={`rounded-lg border px-4 py-3 text-sm ${styles[variant]}`}>{children}</div>;
}

export function Loading({ label = 'Loading…' }) {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-500">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
      {label}
    </div>
  );
}
