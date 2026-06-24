const buttonVariants = {
  primary: 'bg-slate-900 text-white hover:bg-slate-700 disabled:bg-slate-400',
  secondary: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
  danger: 'border border-red-300 bg-white text-red-600 hover:bg-red-50',
};

export function Button({ variant = 'primary', className = '', ...props }) {
  return (
    <button
      className={`rounded-md px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed ${buttonVariants[variant]} ${className}`}
      {...props}
    />
  );
}

export function Card({ className = '', children }) {
  return <div className={`rounded-lg border border-slate-200 bg-white p-6 shadow-sm ${className}`}>{children}</div>;
}

export function Field({ label, hint, children }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
      {hint && <span className="block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

const inputClass =
  'w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500';

export function Input(props) {
  return <input className={inputClass} {...props} />;
}

export function Select(props) {
  return <select className={inputClass} {...props} />;
}

const badgeStyles = {
  pending: 'bg-amber-100 text-amber-800',
  posted: 'bg-emerald-100 text-emerald-800',
  voided: 'bg-slate-200 text-slate-600',
};

export function StatusBadge({ status }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeStyles[status] || ''}`}>
      {status}
    </span>
  );
}

const typeStyles = {
  asset: 'bg-sky-100 text-sky-800',
  liability: 'bg-violet-100 text-violet-800',
};

export function TypeBadge({ type }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${typeStyles[type] || ''}`}>
      {type}
    </span>
  );
}

export function Alert({ children }) {
  if (!children) return null;
  return <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{children}</div>;
}

export function Loading({ label = 'Loading…' }) {
  return <p className="text-sm text-slate-500">{label}</p>;
}
