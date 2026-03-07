import React from 'react';
import { DashboardStats } from '../types';
import { Activity, AlertCircle, BarChart3, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardProps {
  stats: DashboardStats;
}

export const Dashboard: React.FC<DashboardProps> = ({ stats }) => {
  const cards = [
    {
      label: 'Total Reports',
      value: stats.total,
      icon: Activity,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      label: 'High Severity',
      value: stats.highSeverity,
      icon: AlertCircle,
      color: 'text-red-600',
      bg: 'bg-red-50'
    },
    {
      label: 'Most Common',
      value: stats.mostCommon,
      icon: BarChart3,
      color: 'text-amber-600',
      bg: 'bg-amber-50'
    },
    {
      label: 'Safety Score',
      value: stats.total > 0 ? Math.max(0, 100 - (stats.highSeverity * 10)).toFixed(0) + '%' : '100%',
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((card, idx) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex items-center gap-4"
        >
          <div className={`p-3 rounded-xl ${card.bg}`}>
            <card.icon className={`w-6 h-6 ${card.color}`} />
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{card.label}</p>
            <p className="text-2xl font-bold text-zinc-900">{card.value}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
