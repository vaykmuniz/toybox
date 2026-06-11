import { useCallback, useEffect, useState } from 'react';

import { useAuthSession } from '@/hooks/use-auth-session.hook';
import { fetchRecentCatches, type RecentCatch } from '@/services/odds-api';

export type { RecentCatch, RecentCatchOwner } from '@/services/odds-api';

export interface GetRecentCatchesResult {
  catches: RecentCatch[];
  error: Error | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

const normalizeRecentCatchesError = (fetchError: unknown) => {
  return fetchError instanceof Error ? fetchError : new Error('Failed to fetch recent catches');
};

export const useGetRecentCatches = (): GetRecentCatchesResult => {
  const { isLoading: isAuthLoading, user } = useAuthSession();
  const [catches, setCatches] = useState<RecentCatch[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (isAuthLoading) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      setCatches(await fetchRecentCatches({ accessToken: user?.access_token }));
    } catch (fetchError) {
      console.log(fetchError);
      setError(normalizeRecentCatchesError(fetchError));
    } finally {
      setIsLoading(false);
    }
  }, [isAuthLoading, user?.access_token]);

  useEffect(() => {
    let isMounted = true;

    if (isAuthLoading) {
      return () => {
        isMounted = false;
      };
    }

    fetchRecentCatches({ accessToken: user?.access_token })
      .then((nextCatches) => {
        if (isMounted) {
          setCatches(nextCatches);
        }
      })
      .catch((fetchError) => {
        console.log(fetchError);
        if (isMounted) {
          setError(normalizeRecentCatchesError(fetchError));
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthLoading, user?.access_token]);

  return {
    catches,
    error,
    isLoading,
    refetch,
  };
};
