'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authApi } from '@/lib/api';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'carwise_token';
const USER_KEY = 'carwise_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Load session from local storage and verify with backend
  useEffect(() => {
    async function initSession() {
      try {
        const storedToken = localStorage.getItem(TOKEN_KEY);
        const storedUserStr = localStorage.getItem(USER_KEY);

        if (storedToken && storedUserStr) {
          const parsedUser = JSON.parse(storedUserStr);
          setToken(storedToken);
          setUser(parsedUser);

          // Verify token validity against backend
          try {
            const meRes = await authApi.me();
            if (meRes.success && meRes.data?.user) {
              setUser(meRes.data.user);
              localStorage.setItem(USER_KEY, JSON.stringify(meRes.data.user));
            }
          } catch (verifyErr) {
            console.warn('Session verification notice, resetting token.');
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            setUser(null);
            setToken(null);
          }
        }
      } catch (err) {
        console.error('Failed to parse local session:', err);
      } finally {
        setIsLoading(false);
      }
    }

    initSession();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await authApi.login(email, password);
      if (res.success && res.data?.token && res.data?.user) {
        const userObj: UserProfile = res.data.user;
        const jwtToken: string = res.data.token;

        setToken(jwtToken);
        setUser(userObj);
        localStorage.setItem(TOKEN_KEY, jwtToken);
        localStorage.setItem(USER_KEY, JSON.stringify(userObj));

        return { success: true };
      } else {
        return { success: false, error: res.error?.message || 'Authentication failed.' };
      }
    } catch (err: any) {
      return {
        success: false,
        error: err.response?.data?.error?.message || err.message || 'Unable to log in. Please check your credentials.',
      };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await authApi.register(name, email, password);
      if (res.success && res.data?.token && res.data?.user) {
        const userObj: UserProfile = res.data.user;
        const jwtToken: string = res.data.token;

        setToken(jwtToken);
        setUser(userObj);
        localStorage.setItem(TOKEN_KEY, jwtToken);
        localStorage.setItem(USER_KEY, JSON.stringify(userObj));

        return { success: true };
      } else {
        return { success: false, error: res.error?.message || 'Registration failed.' };
      }
    } catch (err: any) {
      return {
        success: false,
        error: err.response?.data?.error?.message || err.message || 'Unable to complete registration.',
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setToken(null);
    router.push('/auth/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
