import { useCallback, useEffect, useState } from 'react';

import { useAuthSession } from '@/hooks/use-auth-session.hook';
import { fetchProfile, type GetProfile } from '@/services/profile-api';
export type { GetProfile, Toy } from '@/services/profile-api';

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
  const { isLoading: isAuthLoading, user } = useAuthSession();
  const [profile, setProfile] = useState<GetProfile | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (isAuthLoading) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      setProfile(await fetchProfile({ accessToken: user?.access_token }));
    } catch (fetchError) {
      console.log(fetchError);
      setError(normalizeProfileError(fetchError));
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

    fetchProfile({ accessToken: user?.access_token })
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
  }, [isAuthLoading, user?.access_token]);

  return {
    error,
    isLoading,
    profile,
    refetch,
  };
};
