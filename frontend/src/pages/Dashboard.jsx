import { useState } from 'react';
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
import {
  IconPlus,
  IconWallet,
  IconTrendingUp,
  IconTrendingDown,
  IconScale,
  IconClock,
  IconSparkles,
} from '../components/icons';
import { useApi } from '../lib/useApi';
import { useAccounts } from '../lib/useAccounts';
import { useAuth } from '../lib/auth';
import { createSampleLedger } from '../lib/sampleData';

export default function Dashboard() {
  const call = useApi();
  const navigate = useNavigate();
  const { session } = useAuth();
  const { accounts, loading, error, reload } = useAccounts();
  const [seeding, setSeeding] = useState(false);
  const [seedError, setSeedError] = useState(null);

  const assetAccounts = accounts.filter((account) => account.type === 'asset');
  const liabilityAccounts = accounts.filter((account) => account.type === 'liability');
  const totalAssets = assetAccounts.reduce((sum, account) => sum + account.balance, 0);
  const totalLiabilities = liabilityAccounts.reduce((sum, account) => sum + account.balance, 0);
  const netPosition = accounts.reduce((sum, account) => sum + account.balance, 0);
  const reserved = accounts.reduce((sum, account) => sum + (account.balance - account.availableBalance), 0);

  const seed = async () => {
    setSeeding(true);
    setSeedError(null);
    try {
      await createSampleLedger(call);
      await reload();
    } catch (requestError) {
      setSeedError(requestError.message);
    } finally {
      setSeeding(false);
    }
  };

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
          description="In double-entry accounting money never appears from nowhere — it enters through a liability account and flows into your asset accounts. Spin up a sample ledger to see balances, transfers and history populated, or create your first account."
        >
          <Button onClick={seed} disabled={seeding} icon={<IconSparkles className="h-4 w-4" />}>
            {seeding ? 'Setting up…' : 'Create sample ledger'}
          </Button>
          <Link to="/accounts/new">
            <Button variant="secondary">Create an account</Button>
          </Link>
        </EmptyState>
      )}
      <Alert>{seedError}</Alert>

      {accounts.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label="Total assets"
              value={<Amount minor={totalAssets} />}
              icon={<IconTrendingUp className="h-5 w-5" />}
              accent="emerald"
              hint={`${assetAccounts.length} asset account${assetAccounts.length === 1 ? '' : 's'}`}
            />
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
