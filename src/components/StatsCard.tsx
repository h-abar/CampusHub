import React from 'react';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
  color?: string;
}

export default function StatsCard({ title, value, icon }: StatsCardProps) {
  return (
    <div className="stats-card hover:shadow-md transition-shadow">
      <div className="w-11 h-11 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-extrabold text-slate-800 leading-none mb-1">{value}</div>
        <div className="text-xs text-slate-500 font-medium truncate">{title}</div>
      </div>
    </div>
  );
}
