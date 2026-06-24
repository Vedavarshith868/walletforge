import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Alert, Button, Card, Loading, StatusBadge } from '../components/ui';
import { useApi } from '../lib/useApi';
import { useAccounts } from '../lib/useAccounts';
import { formatAmount } from '../lib/money';

function Row({ label, children }) {
  return (
    <div className="flex justify-between border-b border-slate-100 py-2 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-900">{children}</span>
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
      const data = await call(`/transfers/${id}/${action}`, {
        method: 'POST',
        idempotencyKey: crypto.randomUUID(),
      });
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
    <div className="mx-auto max-w-lg space-y-6">
      <Link to="/transfers" className="text-sm text-slate-500 hover:underline">
        ← Transfers
      </Link>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Transfer</h1>
          <StatusBadge status={transfer.status} />
        </div>

        <Row label="Amount">
          <span className="font-mono">{formatAmount(transfer.amount)}</span>
        </Row>
        <Row label="From">
          <Link to={`/accounts/${transfer.sourceAccountId}`} className="hover:underline">
            {accountName(transfer.sourceAccountId)}
          </Link>
        </Row>
        <Row label="To">
          <Link to={`/accounts/${transfer.destinationAccountId}`} className="hover:underline">
            {accountName(transfer.destinationAccountId)}
          </Link>
        </Row>
        <Row label="Created">{new Date(transfer.createdAt).toLocaleString()}</Row>
        {transfer.postedAt && <Row label="Posted">{new Date(transfer.postedAt).toLocaleString()}</Row>}
        {transfer.voidedAt && <Row label="Voided">{new Date(transfer.voidedAt).toLocaleString()}</Row>}
        {transfer.idempotencyKey && (
          <Row label="Idempotency key">
            <span className="font-mono text-xs">{transfer.idempotencyKey}</span>
          </Row>
        )}
      </Card>

      {transfer.status === 'pending' && (
        <Card>
          <p className="mb-3 text-sm text-slate-600">
            This transfer is pending. Posting moves the money; voiding releases the reserved balance.
          </p>
          <Alert>{error}</Alert>
          <div className="mt-3 flex gap-3">
            <Button onClick={() => act('post')} disabled={working}>
              Post transfer
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
