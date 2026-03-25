import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { settingsAPI } from '@/utils/api';
import { useAuth } from './useAuth';

interface UserSettings {
  notifications: {
    email: {
      courseUpdates: boolean;
      newMessages: boolean;
      achievements: boolean;
      weeklyDigest: boolean;
      marketing: boolean;
    };
    push: {
      courseReminders: boolean;
      achievements: boolean;
      messages: boolean;
    };
  };
  privacy: {
    profileVisibility: 'public' | 'private' | 'friends';
    showProgress: boolean;
    showBadges: boolean;
    allowMessages: boolean;
  };
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    timezone: string;
    autoplay: boolean;
    playbackSpeed: number;
  };
}

interface SettingsContextType {
  settings: UserSettings | null;
  loading: boolean;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  refetchSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoggedIn } = useAuth();
  const queryClient = useQueryClient();
  const [localSettings, setLocalSettings] = useState<UserSettings | null>(null);

  const { data: settings, isLoading, refetch } = useQuery<UserSettings>(
    'user-settings',
    settingsAPI.getSettings,
    {
      enabled: isLoggedIn,
      onSuccess: (data) => {
        setLocalSettings(data);
      }
    }
  );

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    if (localSettings) {
      const updated = { ...localSettings, ...newSettings };
      setLocalSettings(updated);
      queryClient.setQueryData('user-settings', updated);
    }
  };

  const refetchSettings = () => {
    refetch();
  };

  return (
    <SettingsContext.Provider 
      value={{ 
        settings: localSettings, 
        loading: isLoading, 
        updateSettings,
        refetchSettings
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
