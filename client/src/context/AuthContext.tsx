import React, { useState, useEffect } from 'react';
import { AuthContext } from './AuthContextCore';
import { User, UserRole } from '../types';
import { api } from '../lib/api';

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
          const authData = await api.auth.demoLogin('ADMIN');
          if (mounted) {
            localStorage.setItem('reclaim_auth_token', authData.accessToken);
            setToken(authData.accessToken);
            setUser(authData.user);
          }
        } else {
          const currentUser = await api.auth.me();
          if (mounted) {
            setUser(currentUser);
          }
        }
      } catch {
        try {
          const authData = await api.auth.demoLogin('ADMIN');
          if (mounted) {
            localStorage.setItem('reclaim_auth_token', authData.accessToken);
            setToken(authData.accessToken);
            setUser(authData.user);
          }
        } catch (err) {
          console.error('Failed to initialize demo auth', err);
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

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const authData = await api.auth.login(email, password);
      localStorage.setItem('reclaim_auth_token', authData.accessToken);
      setToken(authData.accessToken);
      setUser(authData.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('reclaim_auth_token');
      setToken(null);
      setUser(null);
    }
  };

  const switchRole = async (targetRole: UserRole) => {
    setIsLoading(true);
    try {
      const authData = await api.auth.demoLogin(targetRole);
      localStorage.setItem('reclaim_auth_token', authData.accessToken);
      setToken(authData.accessToken);
      setUser(authData.user);
    } catch (err) {
      console.error(`Failed to switch role to ${targetRole}`, err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const hasRole = (allowedRoles: UserRole[]): boolean => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, switchRole, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};
