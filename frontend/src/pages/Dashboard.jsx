import { Link, useNavigate } from 'react-router-dom';
import {
  Alert,
  Amount,
  Button,
  Card,
  EmptyState,
  Loading,
  PageHeader,
  StatCard,
  Table,
  THead,
  Th,
  TBody,
  TR,
  Td,
  TypeBadge,
} from '../components/ui';
import SeedDataButton from '../components/SeedDataButton';
import {
  IconPlus,
  IconWallet,
  IconTrendingUp,
  IconTrendingDown,
  IconScale,
  IconClock,
} from '../components/icons';
import { useAccounts } from '../lib/useAccounts';
import { useAuth } from '../lib/auth';

export default function Dashboard() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { accounts, loading, error, reload } = useAccounts();

  const assetAccounts = accounts.filter((account) => account.type === 'asset');
  const liabilityAccounts = accounts.filter((account) => account.type === 'liability');
  const totalAssets = assetAccounts.reduce((sum, account) => sum + account.balance, 0);
  const totalLiabilities = liabilityAccounts.reduce((sum, account) => sum + account.balance, 0);
  const netPosition = accounts.reduce((sum, account) => sum + account.balance, 0);
  const reserved = accounts.reduce((sum, account) => sum + (account.balance - account.availableBalance), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overview"
        subtitle={session?.organization?.name}
        actions={
          <>
            <Link to="/accounts/new">
              <Button variant="secondary" icon={<IconPlus className="h-4 w-4" />}>
                New account
              </Button>
            </Link>
            <Link to="/transfer">
              <Button icon={<IconPlus className="h-4 w-4" />}>New transfer</Button>
            </Link>
          </>
        }
      />

      {loading && <Loading />}
      <Alert>{error}</Alert>

      {!loading && accounts.length === 0 && (
        <EmptyState
          icon={<IconWallet className="h-6 w-6" />}
          title="Your ledger is empty"
          description="In double-entry accounting money never appears from nowhere — it enters through a liability account and flows into your asset accounts. Generate a sample ledger to see balances, transfers and history populated, or create your first account."
        >
          <SeedDataButton onSeeded={reload} />
          <Link to="/accounts/new">
            <Button variant="secondary">Create an account</Button>
          </Link>
        </EmptyState>
      )}

      {accounts.length > 0 && (
        <>
          <Card className="relative overflow-hidden">
            <div className="glow-orb -right-10 -top-20 h-56 w-56 bg-sky-500/20" />
            <div className="relative flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Total balance</p>
                <p className="mt-2 text-4xl font-semibold tabular-nums text-white">
                  <Amount minor={totalAssets} />
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-300 ring-1 ring-emerald-400/20">
                    <IconTrendingUp className="h-3.5 w-3.5" /> Net balanced
                  </span>
                  <span className="text-xs text-slate-500">
                    {accounts.length} accounts · {assetAccounts.length} asset · {liabilityAccounts.length} liability
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Link to="/transfer">
                  <Button>New transfer</Button>
                </Link>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              label="Total liabilities"
              value={<Amount minor={totalLiabilities} />}
              icon={<IconTrendingDown className="h-5 w-5" />}
              accent="violet"
              hint={`${liabilityAccounts.length} liability account${liabilityAccounts.length === 1 ? '' : 's'}`}
            />
            <StatCard
              label="Net position"
              value={<Amount minor={netPosition} />}
              icon={<IconScale className="h-5 w-5" />}
              accent={netPosition === 0 ? 'emerald' : 'rose'}
              hint={netPosition === 0 ? 'Ledger is balanced ✓' : 'Out of balance'}
            />
            <StatCard
              label="Reserved"
              value={<Amount minor={reserved} />}
              icon={<IconClock className="h-5 w-5" />}
              accent="amber"
              hint="Held by pending transfers"
            />
          </div>

          <Card padded={false}>
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <h2 className="font-semibold text-white">Accounts</h2>
              <Link to="/accounts/new" className="text-sm font-medium text-sky-400 hover:text-sky-300">
                + New account
              </Link>
            </div>
            <Table>
              <THead>
                <Th>Account</Th>
                <Th>Type</Th>
                <Th className="text-right">Balance</Th>
                <Th className="text-right">Available</Th>
              </THead>
              <TBody>
                {accounts.map((account) => (
                  <TR key={account.id} onClick={() => navigate(`/accounts/${account.id}`)}>
                    <Td className="font-medium text-white">{account.name}</Td>
                    <Td>
                      <TypeBadge type={account.type} />
                    </Td>
                    <Td className="text-right font-medium text-white">
                      <Amount minor={account.balance} />
                    </Td>
                    <Td className="text-right text-slate-400">
                      <Amount minor={account.availableBalance} />
                    </Td>
                  </TR>
                ))}
              </TBody>
            </Table>
          </Card>
        </>
      )}
    </div>
  );
}
