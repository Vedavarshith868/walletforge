import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Card, Loading, StatusBadge } from '../components/ui';
import { useApi } from '../lib/useApi';
import { useAccounts } from '../lib/useAccounts';
import { formatAmount } from '../lib/money';

const PAGE_SIZE = 15;
const FILTERS = ['all', 'pending', 'posted', 'voided'];

export default function Transfers() {
  const call = useApi();
  const { accountsById } = useAccounts();

  const [status, setStatus] = useState('all');
  const [transfers, setTransfers] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const buildPath = useCallback(
    (nextOffset) => {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(nextOffset) });
      if (status !== 'all') params.set('status', status);
      return `/transfers?${params.toString()}`;
    },
    [status]
  );

  useEffect(() => {
    let active = true;
    setLoading(true);
    call(buildPath(0))
      .then((data) => {
        if (!active) return;
        setTransfers(data.transfers);
        setHasMore(data.hasMore);
        setOffset(data.transfers.length);
        setError(null);
      })
      .catch((requestError) => active && setError(requestError.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [call, buildPath]);

  const loadMore = async () => {
    const data = await call(buildPath(offset));
    setTransfers((current) => [...current, ...data.transfers]);
    setHasMore(data.hasMore);
    setOffset((current) => current + data.transfers.length);
  };

  const accountName = (accountId) => accountsById[accountId]?.name || accountId.slice(0, 8);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Transfers</h1>

      <div className="flex gap-2">
        {FILTERS.map((option) => (
          <button
            key={option}
            onClick={() => setStatus(option)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize ${
              status === option ? 'bg-slate-900 text-white' : 'border border-slate-300 bg-white text-slate-600'
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      {loading && <Loading />}
      <Alert>{error}</Alert>

      {!loading && transfers.length === 0 && (
        <Card>
          <p className="text-sm text-slate-500">No transfers to show.</p>
        </Card>
      )}

      {transfers.length > 0 && (
        <Card className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-6 py-3 font-medium">From</th>
                <th className="px-6 py-3 font-medium">To</th>
                <th className="px-6 py-3 text-right font-medium">Amount</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {transfers.map((transfer) => (
                <tr key={transfer.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-6 py-3">{accountName(transfer.sourceAccountId)}</td>
                  <td className="px-6 py-3">{accountName(transfer.destinationAccountId)}</td>
                  <td className="px-6 py-3 text-right font-mono">{formatAmount(transfer.amount)}</td>
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
        <button onClick={loadMore} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm">
          Load more
        </button>
      )}
    </div>
  );
}
