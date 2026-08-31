import { createContext, ReactNode, useContext, useState } from 'react';
import { apiFetch, setToken } from '../api/client';

export interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  roles: string[];
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (...roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem('forlms.user');
    return stored ? JSON.parse(stored) : null;
  });

  async function login(username: string, password: string) {
    const result = await apiFetch<{ accessToken: string; user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    setToken(result.accessToken);
    localStorage.setItem('forlms.user', JSON.stringify(result.user));
    setUser(result.user);
  }

  function logout() {
    setToken(null);
    localStorage.removeItem('forlms.user');
    setUser(null);
  }

  function hasRole(...roles: string[]) {
    return !!user && roles.some((r) => user.roles.includes(r));
  }

  return <AuthContext.Provider value={{ user, login, logout, hasRole }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
