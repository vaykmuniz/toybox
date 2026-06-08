import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  clearStoredAuthSession,
  getStoredAuthSession,
  storeAuthSession,
  type AuthSession,
} from '@/services/auth-session-storage';

export interface AuthSessionResult {
  clearSession: () => Promise<void>;
  isLoading: boolean;
  setSession: (session: AuthSession) => Promise<void>;
  user: AuthSession | null;
}

const AuthSessionContext = createContext<AuthSessionResult | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    getStoredAuthSession()
      .then((storedSession) => {
        if (isMounted) {
          setUser(storedSession);
        }
      })
      .catch((error) => {
        console.log(error);
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

  const setSession = useCallback(async (session: AuthSession) => {
    await storeAuthSession(session);
    setUser(session);
  }, []);

  const clearSession = useCallback(async () => {
    await clearStoredAuthSession();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      clearSession,
      isLoading,
      setSession,
      user,
    }),
    [clearSession, isLoading, setSession, user]
  );

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

export const useAuthSession = (): AuthSessionResult => {
  const context = useContext(AuthSessionContext);

  if (!context) {
    throw new Error('useAuthSession must be used within AuthProvider');
  }

  return context;
};
