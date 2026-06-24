import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { Button } from './ui';
import { Logo, IconDashboard, IconTransfers, IconPlus, IconLogout } from './icons';

const navItems = [
  { to: '/dashboard', label: 'Overview', icon: <IconDashboard className="h-5 w-5" /> },
  { to: '/transfers', label: 'Transactions', icon: <IconTransfers className="h-5 w-5" /> },
];

function navClass({ isActive }) {
  return `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
    isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'
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
    <div className="mx-auto flex min-h-screen max-w-7xl">
      <aside className="glass sticky top-0 hidden h-screen w-64 shrink-0 flex-col rounded-none border-y-0 border-l-0 px-4 py-5 md:flex">
        <Link to="/dashboard" className="mb-8 flex items-center gap-2.5 px-2">
          <Logo className="h-8 w-8" />
          <span className="text-lg font-semibold tracking-tight text-white">WalletForge</span>
        </Link>

        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={navClass}>
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-6">
          <Link to="/transfer">
            <Button className="w-full" icon={<IconPlus className="h-4 w-4" />}>
              New transfer
            </Button>
          </Link>
        </div>

        <div className="mt-auto border-t border-white/10 pt-4">
          <div className="px-2">
            <p className="truncate text-sm font-medium text-white">{session?.organization?.name}</p>
            <p className="truncate text-xs text-slate-500">{session?.user?.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="mt-3 flex w-full items-center gap-2 rounded-xl px-2 py-2 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
          >
            <IconLogout className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex w-full flex-col">
        <header className="glass flex items-center justify-between rounded-none border-x-0 border-t-0 px-4 py-3 md:hidden">
          <Link to="/dashboard" className="flex items-center gap-2">
            <Logo className="h-7 w-7" />
            <span className="font-semibold text-white">WalletForge</span>
          </Link>
          <button onClick={handleSignOut} className="text-sm font-medium text-slate-400">
            Sign out
          </button>
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b border-white/10 px-3 py-2 md:hidden">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={navClass}>
              {item.label}
            </NavLink>
          ))}
          <NavLink to="/transfer" className={navClass}>
            New transfer
          </NavLink>
        </nav>

        <main className="flex-1 px-4 py-8 md:px-8 md:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
