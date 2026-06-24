import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Alert, Button, Card, Loading, StatusBadge, TypeBadge } from '../components/ui';
import { useApi } from '../lib/useApi';
import { useAccounts } from '../lib/useAccounts';
import { formatAmount } from '../lib/money';

const PAGE_SIZE = 10;

export default function AccountDetail() {
  const { id } = useParams();
  const call = useApi();
  const { accountsById } = useAccounts();

  const [account, setAccount] = useState(null);
  const [history, setHistory] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadPage = useCallback(
    async (nextOffset) => {
      const data = await call(`/accounts/${id}/history?limit=${PAGE_SIZE}&offset=${nextOffset}`);
      setHistory((current) => (nextOffset === 0 ? data.transfers : [...current, ...data.transfers]));
      setHasMore(data.hasMore);
      setOffset(nextOffset + data.transfers.length);
    },
    [call, id]
  );

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([call(`/accounts/${id}`), call(`/accounts/${id}/history?limit=${PAGE_SIZE}&offset=0`)])
      .then(([accountData, historyData]) => {
        if (!active) return;
        setAccount(accountData.account);
        setHistory(historyData.transfers);
        setHasMore(historyData.hasMore);
        setOffset(historyData.transfers.length);
        setError(null);
      })
      .catch((requestError) => active && setError(requestError.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [call, id]);

  const counterpartyName = (transfer) => {
    const counterpartyId =
      transfer.direction === 'outgoing' ? transfer.destinationAccountId : transfer.sourceAccountId;
    return accountsById[counterpartyId]?.name || counterpartyId.slice(0, 8);
  };

  if (loading) return <Loading />;
  if (error) return <Alert>{error}</Alert>;
  if (!account) return null;

  return (
    <div className="space-y-6">
      <Link to="/dashboard" className="text-sm text-slate-500 hover:underline">
        ← Accounts
      </Link>

      <Card>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{account.name}</h1>
            <div className="mt-2">
              <TypeBadge type={account.type} />
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-slate-400">Balance</p>
            <p className="font-mono text-2xl">{formatAmount(account.balance)}</p>
            <p className="mt-1 text-xs text-slate-500">Available {formatAmount(account.availableBalance)}</p>
          </div>
        </div>
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-semibold">History</h2>
        {history.length === 0 ? (
          <Card>
            <p className="text-sm text-slate-500">No transfers touch this account yet.</p>
          </Card>
        ) : (
          <Card className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-6 py-3 font-medium">Direction</th>
                  <th className="px-6 py-3 font-medium">Counterparty</th>
                  <th className="px-6 py-3 text-right font-medium">Amount</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {history.map((transfer) => (
                  <tr key={transfer.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-6 py-3">
                      <span className={transfer.direction === 'outgoing' ? 'text-red-600' : 'text-emerald-600'}>
                        {transfer.direction === 'outgoing' ? 'Out' : 'In'}
                      </span>
                    </td>
                    <td className="px-6 py-3">{counterpartyName(transfer)}</td>
                    <td className="px-6 py-3 text-right font-mono">
                      {transfer.direction === 'outgoing' ? '-' : '+'}
                      {formatAmount(transfer.amount)}
                    </td>
                    <td className="px-6 py-3">
                      <StatusBadge status={transfer.status} />
                    </td>
                    <td className="px-6 py-3">
                      <Link to={`/transfers/${transfer.id}`} className="text-slate-500 hover:underline">
                        {new Date(transfer.createdAt).toLocaleString()}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
        {hasMore && (
          <div className="mt-4">
            <Button variant="secondary" onClick={() => loadPage(offset)}>
              Load more
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
