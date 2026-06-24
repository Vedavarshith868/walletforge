import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Alert, Amount, Button, Card, Loading, PageHeader, StatusBadge } from '../components/ui';
import { IconChevronLeft, IconArrowRight } from '../components/icons';
import { useApi } from '../lib/useApi';
import { useAccounts } from '../lib/useAccounts';

function Row({ label, children }) {
  return (
    <div className="flex items-center justify-between border-b border-white/10 py-3 last:border-0">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="text-sm font-medium text-white">{children}</span>
    </div>
  );
}

export default function TransferDetail() {
  const { id } = useParams();
  const call = useApi();
  const { accountsById } = useAccounts();

  const [transfer, setTransfer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [working, setWorking] = useState(false);

  const load = useCallback(async () => {
    const data = await call(`/transfers/${id}`);
    setTransfer(data.transfer);
  }, [call, id]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    load()
      .catch((requestError) => active && setError(requestError.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [load]);

  const act = async (action) => {
    setWorking(true);
    setError(null);
    try {
      const data = await call(`/transfers/${id}/${action}`, { method: 'POST', idempotencyKey: crypto.randomUUID() });
      setTransfer(data.transfer);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setWorking(false);
    }
  };

  const accountName = (accountId) => accountsById[accountId]?.name || accountId;

  if (loading) return <Loading />;
  if (error && !transfer) return <Alert>{error}</Alert>;
  if (!transfer) return null;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader
        title="Transfer"
        back={
          <Link to="/transfers" className="mb-3 inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white">
            <IconChevronLeft className="h-4 w-4" /> Transactions
          </Link>
        }
      />

      <Card>
        <div className="flex flex-col items-center gap-4 border-b border-white/10 pb-6">
          <p className="text-4xl font-semibold tabular-nums text-white">
            <Amount minor={transfer.amount} />
          </p>
          <StatusBadge status={transfer.status} />
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <Link to={`/accounts/${transfer.sourceAccountId}`} className="font-medium hover:text-sky-300">
              {accountName(transfer.sourceAccountId)}
            </Link>
            <IconArrowRight className="h-4 w-4 text-slate-600" />
            <Link to={`/accounts/${transfer.destinationAccountId}`} className="font-medium hover:text-sky-300">
              {accountName(transfer.destinationAccountId)}
            </Link>
          </div>
        </div>

        <div className="mt-2">
          <Row label="Created">{new Date(transfer.createdAt).toLocaleString()}</Row>
          {transfer.postedAt && <Row label="Posted">{new Date(transfer.postedAt).toLocaleString()}</Row>}
          {transfer.voidedAt && <Row label="Voided">{new Date(transfer.voidedAt).toLocaleString()}</Row>}
          {transfer.idempotencyKey && (
            <Row label="Idempotency key">
              <span className="font-mono text-xs text-slate-500">{transfer.idempotencyKey}</span>
            </Row>
          )}
        </div>
      </Card>

      {transfer.status === 'pending' && (
        <Card>
          <p className="text-sm text-slate-600">
            This transfer is pending — the source balance is reserved but not yet moved. Post it to settle the funds, or
            void it to release the reservation.
          </p>
          <Alert>{error}</Alert>
          <div className="mt-4 flex gap-3">
            <Button onClick={() => act('post')} disabled={working}>
              {working ? 'Working…' : 'Post transfer'}
            </Button>
            <Button variant="danger" onClick={() => act('void')} disabled={working}>
              Void transfer
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
