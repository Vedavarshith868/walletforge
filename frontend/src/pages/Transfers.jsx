import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Alert,
  Amount,
  Button,
  Card,
  EmptyState,
  Loading,
  PageHeader,
  StatusBadge,
  Table,
  THead,
  Th,
  TBody,
  TR,
  Td,
} from '../components/ui';
import { IconPlus, IconTransfers, IconArrowRight } from '../components/icons';
import SeedDataButton from '../components/SeedDataButton';
import { useApi } from '../lib/useApi';
import { useAccounts } from '../lib/useAccounts';

const PAGE_SIZE = 15;
const FILTERS = ['all', 'pending', 'posted', 'voided'];

export default function Transfers() {
  const call = useApi();
  const navigate = useNavigate();
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

  const accountName = (accountId) => accountsById[accountId]?.name || `${accountId.slice(0, 8)}…`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transactions"
        subtitle="Every posting in your ledger, newest first."
        actions={
          <Link to="/transfer">
            <Button icon={<IconPlus className="h-4 w-4" />}>New transfer</Button>
          </Link>
        }
      />

      <div className="glass flex gap-1 rounded-xl p-1 shadow-card sm:inline-flex">
        {FILTERS.map((option) => (
          <button
            key={option}
            onClick={() => setStatus(option)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition ${
              status === option ? 'bg-white text-slate-900' : 'text-slate-400 hover:text-white'
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      {loading && <Loading />}
      <Alert>{error}</Alert>

      {!loading && transfers.length === 0 && (
        <EmptyState
          icon={<IconTransfers className="h-6 w-6" />}
          title={status === 'all' ? 'No transactions yet' : `No ${status} transfers`}
          description={
            status === 'all'
              ? 'Generate a sample ledger to populate company accounts and transfers, or create your own transfer.'
              : 'Try a different filter, or create a new transfer.'
          }
        >
          {status === 'all' && <SeedDataButton />}
          <Link to="/transfer">
            <Button variant="secondary">New transfer</Button>
          </Link>
        </EmptyState>
      )}

      {transfers.length > 0 && (
        <Card padded={false}>
          <Table>
            <THead>
              <Th>From</Th>
              <Th />
              <Th>To</Th>
              <Th className="text-right">Amount</Th>
              <Th>Status</Th>
              <Th>Created</Th>
            </THead>
            <TBody>
              {transfers.map((transfer) => (
                <TR key={transfer.id} onClick={() => navigate(`/transfers/${transfer.id}`)}>
                  <Td className="text-white">{accountName(transfer.sourceAccountId)}</Td>
                  <Td className="text-slate-600">
                    <IconArrowRight className="h-4 w-4" />
                  </Td>
                  <Td className="text-white">{accountName(transfer.destinationAccountId)}</Td>
                  <Td className="text-right font-medium text-white">
                    <Amount minor={transfer.amount} />
                  </Td>
                  <Td>
                    <StatusBadge status={transfer.status} />
                  </Td>
                  <Td className="text-slate-400">{new Date(transfer.createdAt).toLocaleString()}</Td>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      )}

      {hasMore && (
        <Button variant="secondary" onClick={loadMore}>
          Load more
        </Button>
      )}
    </div>
  );
}
