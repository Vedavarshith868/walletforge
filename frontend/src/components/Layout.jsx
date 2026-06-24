import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

function navLinkClass({ isActive }) {
  return `rounded-md px-3 py-2 text-sm font-medium ${
    isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
  }`;
}

export default function Layout() {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="text-lg font-semibold">
              WalletForge
            </Link>
            <nav className="flex gap-1">
              <NavLink to="/dashboard" className={navLinkClass}>
                Accounts
              </NavLink>
              <NavLink to="/transfer" className={navLinkClass}>
                New Transfer
              </NavLink>
              <NavLink to="/transfers" className={navLinkClass}>
                Transfers
              </NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-slate-500">{session?.organization?.name}</span>
            <button onClick={handleSignOut} className="rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-100">
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
