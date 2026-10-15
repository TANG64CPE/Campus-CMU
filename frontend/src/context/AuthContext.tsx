import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithCmu: () => void;
  mockLogin: (data: { studentId?: string; name?: string; email?: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // Capture this before child effects can clean the callback query from history.
  const arrivedFromOAuth = useRef(
    new URLSearchParams(window.location.search).get('login') === 'success'
  );

  const fetchCurrentUser = async () => {
    try {
      const currentUser = await authApi.getMe();
      setUser(currentUser);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // A normal app visit starts signed out. Preserve the session only when
    // returning from the CMU OAuth callback, where the server just created it.
    if (arrivedFromOAuth.current) {
      fetchCurrentUser();
      return;
    }

    const startSignedOut = async () => {
      try {
        await authApi.logout();
      } catch {
        // Keep the UI signed out even if the server session is already gone.
      } finally {
        setUser(null);
        setLoading(false);
      }
    };
    startSignedOut();
  }, []);

  const loginWithCmu = () => {
    // Redirect to CMU OAuth initiation endpoint
    window.location.href = '/api/auth/cmu';
  };

  const mockLogin = async (data: { studentId?: string; name?: string; email?: string }) => {
    setLoading(true);
    try {
      const loggedInUser = await authApi.mockLogin(data);
      setUser(loggedInUser);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
      setUser(null);
    }
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithCmu,
        mockLogin,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
