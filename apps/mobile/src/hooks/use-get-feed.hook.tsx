import { useCallback, useEffect, useState } from 'react';

import { fetchFeed, type GetFeed } from '@/services/feed-api';
export type { FeedAuthor, FeedItem, GetFeed } from '@/services/feed-api';

export interface GetFeedResult extends GetFeed {
  error: Error | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

const normalizeFeedError = (fetchError: unknown) => {
  return fetchError instanceof Error ? fetchError : new Error('Failed to fetch feed');
};

export const useGetFeed = (): GetFeedResult => {
  const [feed, setFeed] = useState<GetFeed>({ items: [] });
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      setFeed(await fetchFeed());
    } catch (fetchError) {
      console.log(fetchError);
      setError(normalizeFeedError(fetchError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    fetchFeed()
      .then((nextFeed) => {
        if (isMounted) {
          setFeed(nextFeed);
        }
      })
      .catch((fetchError) => {
        console.log(fetchError);
        if (isMounted) {
          setError(normalizeFeedError(fetchError));
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
  }, []);

  return {
    ...feed,
    error,
    isLoading,
    refetch,
  };
};
