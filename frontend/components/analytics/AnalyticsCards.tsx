import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  color: string;
}

export const MetricCard = ({ label, value, icon: Icon, trend, color }: MetricCardProps) => (
  <div className="bg-white dark:bg-secondary-900 p-6 rounded-2xl border border-secondary-100 dark:border-secondary-800 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-xl ${color} bg-opacity-10 dark:bg-opacity-20`}>
        <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
      </div>
      {trend && (
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
          trend.startsWith('+') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {trend}
        </span>
      )}
    </div>
    <p className="text-secondary-500 dark:text-secondary-400 text-sm font-medium">{label}</p>
    <p className="text-2xl font-bold text-secondary-900 dark:text-white mt-1">{value}</p>
  </div>
);
