
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  email: string;
  name?: string;
  // Add other user properties as needed
}

interface AuthContextProps {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (jwtToken: string, userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedToken = localStorage.getItem('trustledger_token');
        const storedUser = localStorage.getItem('trustledger_user');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        // In case localStorage is not available or JSON.parse fails
        console.error("Failed to initialize auth from localStorage", error);
        // Clear potentially corrupted storage
        localStorage.removeItem('trustledger_token');
        localStorage.removeItem('trustledger_user');
      } finally {
        setIsLoading(false);
      }
    };
    initializeAuth();
  }, []);

  const login = (jwtToken: string, userData: User) => {
    try {
      localStorage.setItem('trustledger_token', jwtToken);
      localStorage.setItem('trustledger_user', JSON.stringify(userData));
      setToken(jwtToken);
      setUser(userData);
    } catch (error) {
      console.error("Failed to save auth data to localStorage", error);
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem('trustledger_token');
      localStorage.removeItem('trustledger_user');
    } catch (error) {
      console.error("Failed to remove auth data from localStorage", error);
    }
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
