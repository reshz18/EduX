import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { settingsAPI } from '@/utils/api';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'react-hot-toast';
import { 
  Settings as SettingsIcon, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  Volume2, 
  Mail, 
  Smartphone,
  Eye,
  EyeOff,
  Save,
  RotateCcw,
  User,
  Lock,
  Monitor,
  Sun,
  Moon
} from 'lucide-react';
import Card from './ui/Card';
import Button from './ui/Button';
import Badge from './ui/Badge';
import LoadingSpinner from './LoadingSpinner';

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

export default function Settings() {
  const { user } = useAuth();
  const { darkMode, toggleTheme, setDarkMode } = useTheme();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState('notifications');
  const [hasChanges, setHasChanges] = useState(false);
  const [localSettings, setLocalSettings] = useState<UserSettings | null>(null);

  // Fetch user settings
  const { data: settings, isLoading } = useQuery(
    'user-settings',
    settingsAPI.getSettings
  );

  // Update mutations
  const updateNotificationsMutation = useMutation(settingsAPI.updateNotifications, {
    onSuccess: () => {
      queryClient.invalidateQueries('user-settings');
      setHasChanges(false);
      toast.success('Notification settings updated successfully!');
    },
    onError: () => {
      toast.error('Failed to update notification settings');
    }
  });

  const updatePrivacyMutation = useMutation(settingsAPI.updatePrivacy, {
    onSuccess: () => {
      queryClient.invalidateQueries('user-settings');
      setHasChanges(false);
      toast.success('Privacy settings updated successfully!');
    },
    onError: () => {
      toast.error('Failed to update privacy settings');
    }
  });

  const updatePreferencesMutation = useMutation(settingsAPI.updatePreferences, {
    onSuccess: () => {
      queryClient.invalidateQueries('user-settings');
      setHasChanges(false);
      toast.success('Preferences updated successfully!');
    },
    onError: () => {
      toast.error('Failed to update preferences');
    }
  });

  const resetSettingsMutation = useMutation(settingsAPI.resetSettings, {
    onSuccess: () => {
      queryClient.invalidateQueries('user-settings');
      setHasChanges(false);
      setLocalSettings(null); // Force reload
      toast.success('Settings reset to default successfully!');
    },
    onError: () => {
      toast.error('Failed to reset settings');
    }
  });

  // Initialize local settings when data loads
  useEffect(() => {
    if (settings && !localSettings) {
      setLocalSettings(settings as UserSettings);
    }
  }, [settings, localSettings]);

  const handleSaveSettings = () => {
    if (!localSettings) return;

    switch (activeTab) {
      case 'notifications':
        updateNotificationsMutation.mutate(localSettings.notifications);
        break;
      case 'privacy':
        updatePrivacyMutation.mutate(localSettings.privacy);
        break;
      case 'preferences':
        // Apply theme immediately
        if (localSettings.preferences.theme === 'dark') {
          setDarkMode(true);
        } else if (localSettings.preferences.theme === 'light') {
          setDarkMode(false);
        } else {
          // Auto mode - use system preference
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          setDarkMode(prefersDark);
        }
        updatePreferencesMutation.mutate(localSettings.preferences);
        break;
    }
  };

  const handleResetSettings = () => {
    if (window.confirm('Are you sure you want to reset all settings to default? This action cannot be undone.')) {
      resetSettingsMutation.mutate();
    }
  };

  const updateLocalSettings = (section: keyof UserSettings, key: string, value: any) => {
    if (!localSettings) return;
    
    setLocalSettings(prev => ({
      ...prev!,
      [section]: {
        ...prev![section],
        [key]: value
      }
    }));
    setHasChanges(true);
  };

  const updateNestedSettings = (section: keyof UserSettings, subsection: string, key: string, value: any) => {
    if (!localSettings) return;
    
    setLocalSettings(prev => ({
      ...prev!,
      [section]: {
        ...prev![section],
        [subsection]: {
          ...(prev![section] as any)[subsection],
          [key]: value
        }
      }
    }));
    setHasChanges(true);
  };

  const tabs = [
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'preferences', label: 'Preferences', icon: Palette },
  ];

  if (isLoading || !localSettings) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your account preferences and privacy settings
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <SettingsIcon className="w-8 h-8 text-gray-400" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <Card className="p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Card className="p-6">
            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Notification Preferences
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Choose how you want to be notified about updates and activities.
                  </p>
                </div>

                {/* Email Notifications */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <Mail className="w-5 h-5 text-gray-500" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Email Notifications
                    </h3>
                  </div>

                  {Object.entries(localSettings.notifications.email).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {key === 'courseUpdates' && 'Get notified when courses you\'re enrolled in are updated'}
                          {key === 'newMessages' && 'Receive emails for new messages and replies'}
                          {key === 'achievements' && 'Get notified when you earn badges or complete challenges'}
                          {key === 'weeklyDigest' && 'Receive a weekly summary of your learning progress'}
                          {key === 'marketing' && 'Receive promotional emails and course recommendations'}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => updateNestedSettings('notifications', 'email', key, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  ))}
                </div>

                {/* Push Notifications */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <Smartphone className="w-5 h-5 text-gray-500" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Push Notifications
                    </h3>
                  </div>

                  {Object.entries(localSettings.notifications.push).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {key === 'courseReminders' && 'Get reminded to continue your learning'}
                          {key === 'achievements' && 'Instant notifications for badges and achievements'}
                          {key === 'messages' && 'Get notified of new messages and community activity'}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => updateNestedSettings('notifications', 'push', key, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Privacy Settings
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Control who can see your profile and learning activity.
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Profile Visibility */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Profile Visibility
                    </label>
                    <div className="space-y-2">
                      {['public', 'private', 'friends'].map((visibility) => (
                        <label key={visibility} className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="radio"
                            name="profileVisibility"
                            value={visibility}
                            checked={localSettings.privacy.profileVisibility === visibility}
                            onChange={(e) => updateLocalSettings('privacy', 'profileVisibility', e.target.value)}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {visibility.charAt(0).toUpperCase() + visibility.slice(1)}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {visibility === 'public' && 'Anyone can view your profile and learning progress'}
                              {visibility === 'private' && 'Only you can see your profile information'}
                              {visibility === 'friends' && 'Only your connections can view your profile'}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Other Privacy Settings */}
                  {Object.entries(localSettings.privacy).filter(([key]) => key !== 'profileVisibility').map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {key === 'showProgress' && 'Display your learning progress on your profile'}
                          {key === 'showBadges' && 'Show your earned badges and achievements'}
                          {key === 'allowMessages' && 'Allow other users to send you messages'}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={value as boolean}
                          onChange={(e) => updateLocalSettings('privacy', key, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    App Preferences
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Customize your learning experience and app behavior.
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Theme Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Theme
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'light', label: 'Light', icon: Sun },
                        { value: 'dark', label: 'Dark', icon: Moon },
                        { value: 'auto', label: 'Auto', icon: Monitor }
                      ].map(({ value, label, icon: Icon }) => (
                        <button
                          key={value}
                          onClick={() => {
                            updateLocalSettings('preferences', 'theme', value);
                            // Apply theme immediately
                            if (value === 'dark') {
                              setDarkMode(true);
                            } else if (value === 'light') {
                              setDarkMode(false);
                            } else {
                              // Auto mode - use system preference
                              const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                              setDarkMode(prefersDark);
                            }
                          }}
                          className={`flex flex-col items-center p-4 rounded-lg border-2 transition-colors ${
                            localSettings.preferences.theme === value
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          <Icon className="w-6 h-6 mb-2 text-gray-600 dark:text-gray-400" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Language */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Language
                    </label>
                    <select
                      value={localSettings.preferences.language}
                      onChange={(e) => updateLocalSettings('preferences', 'language', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="en">English</option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                      <option value="de">Deutsch</option>
                      <option value="zh">中文</option>
                    </select>
                  </div>

                  {/* Timezone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Timezone
                    </label>
                    <select
                      value={localSettings.preferences.timezone}
                      onChange={(e) => updateLocalSettings('preferences', 'timezone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/Denver">Mountain Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                      <option value="Europe/London">London</option>
                      <option value="Europe/Paris">Paris</option>
                      <option value="Asia/Tokyo">Tokyo</option>
                    </select>
                  </div>

                  {/* Video Preferences */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Video Preferences
                    </h3>

                    <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          Autoplay Videos
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Automatically play the next video in a course
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={localSettings.preferences.autoplay}
                          onChange={(e) => updateLocalSettings('preferences', 'autoplay', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Default Playback Speed
                      </label>
                      <select
                        value={localSettings.preferences.playbackSpeed}
                        onChange={(e) => updateLocalSettings('preferences', 'playbackSpeed', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      >
                        <option value={0.5}>0.5x</option>
                        <option value={0.75}>0.75x</option>
                        <option value={1.0}>1.0x (Normal)</option>
                        <option value={1.25}>1.25x</option>
                        <option value={1.5}>1.5x</option>
                        <option value={2.0}>2.0x</option>
                      </select>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={handleResetSettings}
                icon={<RotateCcw className="w-4 h-4" />}
                disabled={resetSettingsMutation.isLoading}
              >
                Reset to Default
              </Button>

              <div className="flex space-x-3">
                {hasChanges && (
                  <Badge variant="warning" size="sm">
                    Unsaved changes
                  </Badge>
                )}
                <Button
                  onClick={handleSaveSettings}
                  disabled={!hasChanges || updateNotificationsMutation.isLoading || updatePrivacyMutation.isLoading || updatePreferencesMutation.isLoading}
                  icon={<Save className="w-4 h-4" />}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}