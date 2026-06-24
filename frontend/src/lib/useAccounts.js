import { useCallback, useEffect, useState } from 'react';
import { useApi } from './useApi';

export function useAccounts() {
  const call = useApi();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await call('/accounts');
      setAccounts(data.accounts);
      setError(null);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [call]);

  useEffect(() => {
    reload();
  }, [reload]);

  const accountsById = Object.fromEntries(accounts.map((account) => [account.id, account]));
  return { accounts, accountsById, loading, error, reload };
}
