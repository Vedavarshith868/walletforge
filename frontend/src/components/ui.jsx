import { formatAmount } from '../lib/money';

const buttonVariants = {
  primary: 'bg-white text-slate-900 hover:bg-slate-200 disabled:bg-white/40 disabled:text-slate-600',
  secondary: 'border border-white/15 bg-white/5 text-slate-200 hover:bg-white/10 disabled:opacity-50',
  danger: 'border border-rose-400/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 disabled:opacity-50',
  ghost: 'text-slate-300 hover:bg-white/5 disabled:opacity-50',
};

export function Button({ variant = 'primary', className = '', icon, children, ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed ${buttonVariants[variant]} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}

export function Card({ className = '', padded = true, children }) {
  return (
    <div className={`glass rounded-2xl shadow-card ${padded ? 'p-6' : ''} ${className}`}>{children}</div>
  );
}

export function PageHeader({ title, subtitle, actions, back }) {
  return (
    <div className="mb-6">
      {back}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

const statAccents = {
  slate: 'bg-white/5 text-slate-300',
  emerald: 'bg-emerald-500/10 text-emerald-300',
  rose: 'bg-rose-500/10 text-rose-300',
  violet: 'bg-violet-500/10 text-violet-300',
  sky: 'bg-sky-500/10 text-sky-300',
  amber: 'bg-amber-500/10 text-amber-300',
};

export function StatCard({ label, value, hint, icon, accent = 'slate' }) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</span>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${statAccents[accent]}`}>{icon}</span>
      </div>
      <div className="text-2xl font-semibold tabular-nums text-white">{value}</div>
      {hint && <div className="text-xs text-slate-500">{hint}</div>}
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
      <tr className="border-b border-white/10 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
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
      className={`border-b border-white/5 last:border-0 ${onClick ? 'cursor-pointer hover:bg-white/5' : ''} ${className}`}
    >
      {children}
    </tr>
  );
}

export function Td({ children, className = '' }) {
  return <td className={`px-5 py-3.5 text-slate-300 ${className}`}>{children}</td>;
}

export function EmptyState({ icon, title, description, children }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-16 text-center">
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sky-500/10 text-sky-300 ring-1 ring-sky-400/20">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-white">{title}</h3>
      {description && <p className="mt-1.5 max-w-md text-sm text-slate-400">{description}</p>}
      {children && <div className="mt-6 flex flex-wrap items-center justify-center gap-3">{children}</div>}
    </div>
  );
}

const statusStyles = {
  pending: 'bg-amber-500/10 text-amber-300 ring-amber-400/20',
  posted: 'bg-emerald-500/10 text-emerald-300 ring-emerald-400/20',
  voided: 'bg-white/5 text-slate-400 ring-white/10',
};

export function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${statusStyles[status] || ''}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

const typeStyles = {
  asset: 'bg-sky-500/10 text-sky-300 ring-sky-400/20',
  liability: 'bg-violet-500/10 text-violet-300 ring-violet-400/20',
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
  const color = colored ? (negative ? 'text-rose-400' : 'text-emerald-400') : '';
  return <span className={`tabular-nums ${color} ${className}`}>{`${prefix}${text}`}</span>;
}

export function Field({ label, hint, children }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-slate-300">{label}</span>
      {children}
      {hint && <span className="block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

const controlClass =
  'w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-sky-400/50 focus:outline-none focus:ring-2 focus:ring-sky-400/20';

export function Input(props) {
  return <input className={controlClass} {...props} />;
}

export function Select(props) {
  return <select className={controlClass} {...props} />;
}

export function Alert({ children, variant = 'error' }) {
  if (!children) return null;
  const styles = {
    error: 'border-rose-400/20 bg-rose-500/10 text-rose-300',
    info: 'border-sky-400/20 bg-sky-500/10 text-sky-300',
  };
  return <div className={`rounded-xl border px-4 py-3 text-sm ${styles[variant]}`}>{children}</div>;
}

export function Loading({ label = 'Loading…' }) {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-400">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      {label}
    </div>
  );
}
