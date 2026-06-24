import { useCallback } from 'react';
import { useAuth } from './auth';
import { apiRequest, ApiError } from './api';

export function useApi() {
  const { session, signOut } = useAuth();

  return useCallback(
    async (path, options = {}) => {
      try {
        return await apiRequest(path, { ...options, token: session?.token });
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) signOut();
        throw error;
      }
    },
    [session, signOut]
  );
}
