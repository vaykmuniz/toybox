import { useCallback, useEffect, useState } from 'react';

import { fetchProfile, type GetProfile } from '@/services/profile-api';
export type { Badge, GetProfile, ProfileStats, Toy } from '@/services/profile-api';

export interface GetProfileResult {
  error: Error | null;
  isLoading: boolean;
  profile: GetProfile | null;
  refetch: () => Promise<void>;
}

const normalizeProfileError = (fetchError: unknown) => {
  return fetchError instanceof Error ? fetchError : new Error('Failed to fetch profile');
};

export const useGetProfile = (): GetProfileResult => {
  const [profile, setProfile] = useState<GetProfile | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      setProfile(await fetchProfile());
    } catch (fetchError) {
      console.log(fetchError);
      setError(normalizeProfileError(fetchError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    fetchProfile()
      .then((nextProfile) => {
        if (isMounted) {
          setProfile(nextProfile);
        }
      })
      .catch((fetchError) => {
        console.log(fetchError);
        if (isMounted) {
          setError(normalizeProfileError(fetchError));
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
    error,
    isLoading,
    profile,
    refetch,
  };
};
