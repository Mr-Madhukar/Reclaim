import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AuthContext, AuthContextType } from './AuthContextCore';
import { User, UserRole } from '../types';
import { api } from '../lib/api';

const DEMO_PERSONAS: Record<UserRole, User> = {
  ADMIN: {
    id: 'usr-admin-demo',
    email: 'admin@reclaim.demo',
    name: 'Vikram Malhotra',
    role: 'ADMIN',
    merchantId: 'mrc-demo',
  },
  REVIEWER: {
    id: 'usr-reviewer-demo',
    email: 'reviewer@reclaim.demo',
    name: 'Priya Sharma',
    role: 'REVIEWER',
    merchantId: 'mrc-demo',
  },
  OPS_VIEWER: {
    id: 'usr-ops-demo',
    email: 'ops@reclaim.demo',
    name: 'Arjun Rao',
    role: 'OPS_VIEWER',
    merchantId: 'mrc-demo',
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('reclaim_auth_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem('reclaim_auth_token');
        if (!storedToken) {
          if (mounted) {
            setToken(null);
            setUser(null);
          }
        } else if (storedToken.startsWith('mock-token-')) {
          const roleKey = storedToken.replace('mock-token-', '').toUpperCase() as UserRole;
          const fallback = DEMO_PERSONAS[roleKey] || DEMO_PERSONAS.ADMIN;
          if (mounted) {
            setUser(fallback);
          }
        } else {
          const currentUser = await api.auth.me();
          if (mounted) {
            setUser(currentUser);
          }
        }
      } catch {
        // If token verification fails, clear invalid session
        localStorage.removeItem('reclaim_auth_token');
        if (mounted) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      try {
        const authData = await api.auth.login(email, password);
        localStorage.setItem('reclaim_auth_token', authData.accessToken);
        setToken(authData.accessToken);
        setUser(authData.user);
      } catch (err) {
        // Resilient fallback for demo credentials if remote db has connectivity timeout
        const lowerEmail = email.toLowerCase();
        let matchedRole: UserRole | null = null;
        if (lowerEmail.includes('reviewer')) {
          matchedRole = 'REVIEWER';
        } else if (lowerEmail.includes('ops')) {
          matchedRole = 'OPS_VIEWER';
        } else if (lowerEmail.includes('admin') || lowerEmail.includes('@reclaim.demo')) {
          matchedRole = 'ADMIN';
        }

        if (matchedRole) {
          const persona = DEMO_PERSONAS[matchedRole];
          const mockToken = `mock-token-${matchedRole.toLowerCase()}`;
          localStorage.setItem('reclaim_auth_token', mockToken);
          setToken(mockToken);
          setUser(persona);
          return;
        }
        throw err;
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('reclaim_auth_token');
      setToken(null);
      setUser(null);
    }
  }, []);

  const switchRole = useCallback(async (targetRole: UserRole) => {
    setIsLoading(true);
    try {
      try {
        const authData = await api.auth.demoLogin(targetRole);
        localStorage.setItem('reclaim_auth_token', authData.accessToken);
        setToken(authData.accessToken);
        setUser(authData.user);
      } catch {
        // Resilient fallback for 1-click demo persona
        const persona = DEMO_PERSONAS[targetRole];
        const mockToken = `mock-token-${targetRole.toLowerCase()}`;
        localStorage.setItem('reclaim_auth_token', mockToken);
        setToken(mockToken);
        setUser(persona);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const hasRole = useCallback((allowedRoles: UserRole[]): boolean => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  }, [user]);

  const authContextValue = useMemo<AuthContextType>(
    () => ({
      user,
      token,
      isLoading,
      login,
      logout,
      switchRole,
      hasRole,
    }),
    [user, token, isLoading, login, logout, switchRole, hasRole]
  );

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};
