import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import * as authApi from '@/api/auth';
import { apiClient } from '@/api/client';
import type { AuthResponse, RegisterForm, User } from '@/api/types';
import { clearRefreshToken, loadRefreshToken, saveRefreshToken } from '@/auth/token-storage';

export type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

type AuthContextValue = {
  status: AuthStatus;
  user: User | null;
  signIn: (username: string, password: string) => Promise<void>;
  signUp: (form: RegisterForm) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/** Keeps track of who is signed in and restores the session when the app opens. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<User | null>(null);

  const applySession = useCallback(async (response: AuthResponse) => {
    apiClient.setAccessToken(response.access_token);
    await saveRefreshToken(response.refresh_token);
    setUser(response.user);
    setStatus('signedIn');
  }, []);

  const endSession = useCallback(async () => {
    apiClient.setAccessToken(null);
    await clearRefreshToken();
    setUser(null);
    setStatus('signedOut');
  }, []);

  // Trade a saved refresh token for a new session, or sign out if that fails
  const resumeSession = useCallback(
    async (refreshToken: string | null): Promise<string | null> => {
      if (refreshToken === null) {
        await endSession();
        return null;
      }
      try {
        const response = await authApi.refresh(refreshToken);
        await applySession(response);
        return response.access_token;
      } catch {
        await endSession();
        return null;
      }
    },
    [applySession, endSession],
  );

  // Called by the API client when the access token expires mid-use
  useEffect(() => {
    apiClient.setRefreshHandler(async () => resumeSession(await loadRefreshToken()));
    return () => apiClient.setRefreshHandler(null);
  }, [resumeSession]);

  // Restore a saved session on launch; state changes only after the storage read finishes
  useEffect(() => {
    loadRefreshToken().then(resumeSession);
  }, [resumeSession]);

  const signIn = useCallback(
    async (username: string, password: string) => {
      const response = await authApi.login(username, password);
      await applySession(response);
    },
    [applySession],
  );

  const signUp = useCallback(
    async (form: RegisterForm) => {
      const response = await authApi.register(form);
      await applySession(response);
    },
    [applySession],
  );

  const value = useMemo(
    () => ({ status, user, signIn, signUp, signOut: endSession }),
    [status, user, signIn, signUp, endSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Read the current session; must be used inside AuthProvider. */
export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (value === null) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return value;
}
