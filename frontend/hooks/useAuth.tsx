import React, { useState, useEffect, createContext, useContext } from 'react';
import { User, UserRole } from '@/types';
import { authAPI } from '@/utils/api';
import { setAuthData, getAuthUser, clearAuthData, isAuthenticated } from '@/utils/auth';
import { toast } from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, username: string, email: string, password: string, role: UserRole) => Promise<User>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  isLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (isAuthenticated()) {
        try {
          const userData = await authAPI.getProfile();
          setUser(userData);
        } catch (error) {
          clearAuthData();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login({ email, password });
      setAuthData(response.token, response.user);
      setUser(response.user);
      toast.success('Welcome back!');
    } catch (error: any) {
      throw error;
    }
  };

  const register = async (name: string, username: string, email: string, password: string, role: UserRole) => {
    try {
      const response = await authAPI.register({ name, username, email, password, role });
      setAuthData(response.token, response.user);
      setUser(response.user);
      toast.success('Account created successfully!');
      
      // Return user data to handle onboarding redirect
      return response.user;
    } catch (error: any) {
      console.error('Registration error:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error('Registration failed. Please try again.');
      }
      throw error;
    }
  };

  const logout = () => {
    clearAuthData();
    setUser(null);
    toast.success('Logged out successfully');
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    isLoggedIn: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};