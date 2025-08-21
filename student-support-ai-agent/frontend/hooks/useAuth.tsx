import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import backend from '~backend/client';
import type { UserProfile } from '~backend/users/me';
import type { LoginRequest } from '~backend/auth/login';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const profile = await backend.users.me();
        setUser(profile);
      } catch (error) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkUser();
  }, []);

  const login = async (credentials: LoginRequest) => {
    const response = await backend.auth.login(credentials);
    // After successful login, get the user profile
    try {
      const profile = await backend.users.me();
      setUser(profile);
    } catch (error) {
      console.error('Failed to get user profile after login:', error);
      setUser(null);
    }
  };

  const logout = async () => {
    try {
      await backend.auth.logout();
    } catch (error) {
      // The session might already be invalid if the cookie expired,
      // so we ignore the error and proceed with local logout.
      console.error("Logout API call failed, clearing session locally:", error);
    }
    
    // Clear user state immediately
    setUser(null);
    
    // Clear any cached data
    localStorage.clear();
    sessionStorage.clear();
    
    // Force a full page reload to clear all state and ensure cookies are cleared
    window.location.href = '/';
  };

  const value = {
    user,
    isLoading,
    isAdmin: user?.isAdmin ?? false,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
