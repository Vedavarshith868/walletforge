import { Link } from 'react-router-dom';
import { Alert, Button, Card, Loading, TypeBadge } from '../components/ui';
import { useAccounts } from '../lib/useAccounts';
import { formatAmount } from '../lib/money';

export default function Dashboard() {
  const { accounts, loading, error } = useAccounts();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Accounts</h1>
        <Link to="/accounts/new">
          <Button>New account</Button>
        </Link>
      </div>

      {loading && <Loading />}
      <Alert>{error}</Alert>

      {!loading && accounts.length === 0 && (
        <Card>
          <p className="text-sm text-slate-600">
            No accounts yet. Create an <span className="font-medium">asset</span> account to hold money and a{' '}
            <span className="font-medium">liability</span> account to fund it — every balance is the result of a
            balanced transfer, so a liability account is how money first enters the ledger.
          </p>
        </Card>
      )}

      {accounts.length > 0 && (
        <Card className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-6 py-3 font-medium">Account</th>
                <th className="px-6 py-3 font-medium">Type</th>
                <th className="px-6 py-3 text-right font-medium">Balance</th>
                <th className="px-6 py-3 text-right font-medium">Available</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-6 py-3">
                    <Link to={`/accounts/${account.id}`} className="font-medium text-slate-900 hover:underline">
                      {account.name}
                    </Link>
                  </td>
                  <td className="px-6 py-3">
                    <TypeBadge type={account.type} />
                  </td>
                  <td className="px-6 py-3 text-right font-mono">{formatAmount(account.balance)}</td>
                  <td className="px-6 py-3 text-right font-mono text-slate-500">
                    {formatAmount(account.availableBalance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
