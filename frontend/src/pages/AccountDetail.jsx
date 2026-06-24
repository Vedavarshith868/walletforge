import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
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
  TypeBadge,
} from '../components/ui';
import { IconChevronLeft, IconArrowUpRight, IconArrowDownLeft, IconTransfers } from '../components/icons';
import { useApi } from '../lib/useApi';
import { useAccounts } from '../lib/useAccounts';

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

  const loadMore = useCallback(async () => {
    const data = await call(`/accounts/${id}/history?limit=${PAGE_SIZE}&offset=${offset}`);
    setHistory((current) => [...current, ...data.transfers]);
    setHasMore(data.hasMore);
    setOffset((current) => current + data.transfers.length);
  }, [call, id, offset]);

  const counterpartyName = (transfer) => {
    const counterpartyId =
      transfer.direction === 'outgoing' ? transfer.destinationAccountId : transfer.sourceAccountId;
    return accountsById[counterpartyId]?.name || `${counterpartyId.slice(0, 8)}…`;
  };

  if (loading) return <Loading />;
  if (error && !account) return <Alert>{error}</Alert>;
  if (!account) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={account.name}
        back={
          <Link to="/dashboard" className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
            <IconChevronLeft className="h-4 w-4" /> Overview
          </Link>
        }
        actions={
          <Link to="/transfer">
            <Button variant="secondary">New transfer</Button>
          </Link>
        }
      />

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <TypeBadge type={account.type} />
            <p className="text-xs uppercase tracking-wide text-slate-400">Posted balance</p>
            <p className="text-3xl font-semibold tabular-nums text-slate-900">
              <Amount minor={account.balance} />
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 px-4 py-3 text-right">
            <p className="text-xs uppercase tracking-wide text-slate-400">Available</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-slate-700">
              <Amount minor={account.availableBalance} />
            </p>
            <p className="mt-0.5 text-xs text-slate-400">balance minus pending out</p>
          </div>
        </div>
      </Card>

      <div>
        <h2 className="mb-3 font-semibold text-slate-900">Transaction history</h2>
        {history.length === 0 ? (
          <EmptyState
            icon={<IconTransfers className="h-6 w-6" />}
            title="No transactions yet"
            description="Transfers that debit or credit this account will appear here."
          >
            <Link to="/transfer">
              <Button>New transfer</Button>
            </Link>
          </EmptyState>
        ) : (
          <Card padded={false}>
            <Table>
              <THead>
                <Th>Direction</Th>
                <Th>Counterparty</Th>
                <Th className="text-right">Amount</Th>
                <Th>Status</Th>
                <Th>When</Th>
              </THead>
              <TBody>
                {history.map((transfer) => {
                  const outgoing = transfer.direction === 'outgoing';
                  return (
                    <TR key={transfer.id}>
                      <Td>
                        <span
                          className={`inline-flex items-center gap-1.5 font-medium ${
                            outgoing ? 'text-rose-600' : 'text-emerald-600'
                          }`}
                        >
                          {outgoing ? (
                            <IconArrowUpRight className="h-4 w-4" />
                          ) : (
                            <IconArrowDownLeft className="h-4 w-4" />
                          )}
                          {outgoing ? 'Out' : 'In'}
                        </span>
                      </Td>
                      <Td className="text-slate-900">{counterpartyName(transfer)}</Td>
                      <Td className="text-right font-medium">
                        <Amount minor={outgoing ? -transfer.amount : transfer.amount} colored showSign />
                      </Td>
                      <Td>
                        <StatusBadge status={transfer.status} />
                      </Td>
                      <Td>
                        <Link to={`/transfers/${transfer.id}`} className="text-slate-500 hover:text-indigo-600">
                          {new Date(transfer.createdAt).toLocaleString()}
                        </Link>
                      </Td>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          </Card>
        )}
        {hasMore && (
          <div className="mt-4">
            <Button variant="secondary" onClick={loadMore}>
              Load more
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
