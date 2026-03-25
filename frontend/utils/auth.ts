import Cookies from 'js-cookie';
import { User } from '@/types';

export const TOKEN_KEY = 'token';
export const USER_KEY = 'user';

export const setAuthData = (token: string, user: User) => {
  Cookies.set(TOKEN_KEY, token, { expires: 7 }); // 7 days
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getAuthToken = (): string | null => {
  return Cookies.get(TOKEN_KEY) || null;
};

export const getAuthUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

export const clearAuthData = () => {
  Cookies.remove(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

export const updateAuthUser = (user: User) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};