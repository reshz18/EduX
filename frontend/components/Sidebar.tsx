import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { View, UserRole } from '@/types';
import {
  Home,
  BookOpen,
  Gift,
  Users,
  Bot,
  Video,
  FileText,
  Award,
  Trophy,
  Settings,
  Menu,
  X,
  Sun,
  Moon,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  currentView: View;
  setView: (view: View) => void;
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
  darkMode: boolean;
  toggleTheme: () => void;
}

export default function Sidebar({
  currentView,
  setView,
  expanded,
  setExpanded,
  darkMode,
  toggleTheme
}: SidebarProps) {
  const { user, logout } = useAuth();

  const menuItems = [
    { view: View.DASHBOARD, icon: Home, label: 'Dashboard', roles: ['STUDENT', 'EDUCATOR', 'ADMIN'] },
    { view: View.COURSES, icon: BookOpen, label: 'Courses', roles: ['STUDENT', 'EDUCATOR', 'ADMIN'] },
    { view: View.CREATOR, icon: Video, label: 'Create Course', roles: ['EDUCATOR', 'ADMIN'] },
    { view: View.ANALYTICS, icon: Trophy, label: 'Analytics', roles: ['STUDENT', 'EDUCATOR', 'ADMIN'] },
    { view: View.REWARDS, icon: Gift, label: 'Spin Rewards', roles: ['STUDENT'] },
    { view: View.COMMUNITY, icon: Users, label: 'Community', roles: ['STUDENT', 'EDUCATOR', 'ADMIN'] },
    { view: View.BOT, icon: Bot, label: 'EduxBot', roles: ['STUDENT', 'EDUCATOR', 'ADMIN'] },
    { view: View.NOTES, icon: FileText, label: 'Notes', roles: ['STUDENT', 'EDUCATOR', 'ADMIN'] },
    { view: View.CERTIFICATES, icon: Award, label: 'Certificates', roles: ['STUDENT', 'ADMIN'] },
    { view: View.LEADERBOARD, icon: Trophy, label: 'Leaderboard', roles: ['STUDENT', 'ADMIN'] },
    { view: View.SETTINGS, icon: Settings, label: 'Settings', roles: ['STUDENT', 'EDUCATOR', 'ADMIN'] },
    { href: '/admin/signature', icon: Settings, label: 'Admin Settings', roles: ['ADMIN'] },
  ];

  const filteredMenuItems = menuItems.filter((item: any) => 
    item.roles.includes(user?.role || 'STUDENT')
  );

  return (
    <div
      className={`fixed left-0 top-0 h-full bg-white dark:bg-secondary-900 border-r border-secondary-200 dark:border-secondary-700 transition-all duration-300 z-50 ${
        expanded ? 'w-64' : 'w-16'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-secondary-200 dark:border-secondary-700">
        {expanded && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">E</span>
            </div>
            <span className="font-display font-bold text-xl text-secondary-900 dark:text-white">
              EduX
            </span>
          </div>
        )}
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors"
        >
          {expanded ? (
            <ChevronLeft className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
          )}
        </button>
      </div>

      {/* User Profile */}
      {user && (
        <div className="p-4 border-b border-secondary-200 dark:border-secondary-700">
          <div className="flex items-center space-x-3">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-10 h-10 rounded-full"
            />
            {expanded && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-secondary-900 dark:text-white truncate">
                  {user.name}
                </p>
                <p className="text-xs text-secondary-500 dark:text-secondary-400 capitalize">
                  {user.role.toLowerCase()}
                </p>
                {user.role === UserRole.STUDENT && (
                  <p className="text-xs text-primary-600 dark:text-primary-400">
                    {user.points} points
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.view;

          return (
            <button
              key={item.label}
              onClick={() => {
                if (item.href) {
                  window.location.href = item.href;
                } else if (item.view) {
                  setView(item.view);
                }
              }}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                isActive && !item.href
                  ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                  : 'text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-800'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {expanded && (
                <span className="text-sm font-medium truncate">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>


      {/* Footer */}
      <div className="p-4 border-t border-secondary-200 dark:border-secondary-700 space-y-2">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors"
        >
          {darkMode ? (
            <Sun className="w-5 h-5 flex-shrink-0" />
          ) : (
            <Moon className="w-5 h-5 flex-shrink-0" />
          )}
          {expanded && (
            <span className="text-sm font-medium">
              {darkMode ? 'Light Mode' : 'Dark Mode'}
            </span>
          )}
        </button>

        <button
          onClick={logout}
          className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {expanded && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </div>
  );
}