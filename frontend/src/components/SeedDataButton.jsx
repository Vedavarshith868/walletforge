import { useState } from 'react';
import { Button } from './ui';
import { IconSparkles } from './icons';
import { useApi } from '../lib/useApi';
import { createSampleLedger } from '../lib/sampleData';

export default function SeedDataButton({ onSeeded, label = 'Create sample ledger', variant = 'primary' }) {
  const call = useApi();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      await createSampleLedger(call);
      if (onSeeded) await onSeeded();
      else window.location.reload();
    } catch (requestError) {
      setError(requestError.message);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <Button onClick={run} disabled={loading} variant={variant} icon={<IconSparkles className="h-4 w-4" />}>
        {loading ? 'Building sample ledger…' : label}
      </Button>
      {error && <span className="text-xs text-rose-400">{error}</span>}
    </div>
  );
}
