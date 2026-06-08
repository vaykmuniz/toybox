import * as SecureStore from 'expo-secure-store';

import type { LoginResponse } from './auth-api';

export type AuthSession = LoginResponse;

const AuthSessionStorageKey = 'toybox.authSession';

const isAuthSession = (value: unknown): value is AuthSession => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const session = value as Partial<AuthSession>;

  return (
    typeof session.id === 'string' &&
    typeof session.email === 'string' &&
    typeof session.username === 'string' &&
    typeof session.name === 'string' &&
    typeof session.access_token === 'string' &&
    session.token_type === 'bearer' &&
    typeof session.expires_at === 'string'
  );
};

export const getStoredAuthSession = async (): Promise<AuthSession | null> => {
  const storedSession = await SecureStore.getItemAsync(AuthSessionStorageKey);

  if (!storedSession) {
    return null;
  }

  try {
    const parsedSession = JSON.parse(storedSession) as unknown;

    if (isAuthSession(parsedSession)) {
      return parsedSession;
    }
  } catch {
    // Clear unreadable data so future launches do not keep parsing it.
  }

  await SecureStore.deleteItemAsync(AuthSessionStorageKey);

  return null;
};

export const storeAuthSession = async (session: AuthSession): Promise<void> => {
  await SecureStore.setItemAsync(AuthSessionStorageKey, JSON.stringify(session));
};

export const clearStoredAuthSession = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(AuthSessionStorageKey);
};
