import React from 'react';

interface StatCardProps {
  title: string;
  value: React.ReactNode;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: string;
  className?: string;
  color?: 'emerald' | 'blue' | 'rose' | 'amber' | 'indigo' | 'sky' | 'slate';
}

export const StatCard = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  className = '',
  color = 'slate'
}: StatCardProps) => {

  // Color mappings for different themes
  const colorStyles = {
    emerald: {
      bg: 'from-emerald-50 to-white',
      border: 'border-emerald-100',
      iconBg: 'bg-emerald-100',
      text: 'text-emerald-900',
      subtext: 'text-emerald-600/80',
      iconColor: 'text-emerald-600'
    },
    blue: {
      bg: 'from-blue-50 to-white',
      border: 'border-blue-100',
      iconBg: 'bg-blue-100',
      text: 'text-blue-900',
      subtext: 'text-blue-600/80',
      iconColor: 'text-blue-600'
    },
    sky: {
      bg: 'from-sky-50 to-white',
      border: 'border-sky-100',
      iconBg: 'bg-sky-100',
      text: 'text-sky-900',
      subtext: 'text-sky-600/80',
      iconColor: 'text-sky-600'
    },
    rose: {
      bg: 'from-rose-50 to-white',
      border: 'border-rose-100',
      iconBg: 'bg-rose-100',
      text: 'text-rose-900',
      subtext: 'text-rose-600/80',
      iconColor: 'text-rose-600'
    },
    amber: {
      bg: 'from-amber-50 to-white',
      border: 'border-amber-100',
      iconBg: 'bg-amber-100',
      text: 'text-amber-900',
      subtext: 'text-amber-600/80',
      iconColor: 'text-amber-600'
    },
    indigo: {
      bg: 'from-indigo-50 to-white',
      border: 'border-indigo-100',
      iconBg: 'bg-indigo-100',
      text: 'text-indigo-900',
      subtext: 'text-indigo-600/80',
      iconColor: 'text-indigo-600'
    },
    slate: {
      bg: 'from-white to-slate-50',
      border: 'border-slate-200',
      iconBg: 'bg-slate-100',
      text: 'text-slate-800',
      subtext: 'text-slate-500',
      iconColor: 'text-slate-600'
    }
  };

  const theme = colorStyles[color] || colorStyles.slate;

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl border ${theme.border} 
        bg-gradient-to-br ${theme.bg} p-5 
        shadow-sm transition-all duration-300 
        hover:shadow-xl hover:-translate-y-1 hover:border-transparent
        group ${className}
      `}
    >
      {/* Decorative background circle */}
      <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full ${theme.iconBg} opacity-20 transition-transform duration-500 group-hover:scale-150`}></div>

      <div className="relative flex items-start justify-between z-10">
        <div>
          <div className={`text-sm font-medium tracking-wide uppercase ${theme.subtext}`}>
            {title}
          </div>
          <div className={`mt-2 text-3xl font-bold tracking-tight ${theme.text} transition-all group-hover:scale-105 origin-left`}>
            {value}
          </div>
          {subtitle && (
            <div className={`mt-2 flex items-center gap-1 text-xs font-medium ${theme.subtext}`}>
              {subtitle}
            </div>
          )}
        </div>

        {icon && (
          <div className={`ml-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${theme.iconBg} ${theme.iconColor} shadow-inner transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110`}>
            {/* Clone icon to enforce size if needed, though usually size is passed in icon prop */}
            {React.cloneElement(icon as React.ReactElement, { size: 24, className: 'currentColor' })}
          </div>
        )}
      </div>

      {trend && <div className="mt-3 text-sm text-slate-500">{trend}</div>}

      {/* Bottom accent line */}
      <div className={`absolute bottom-0 left-0 h-1 w-0 ${theme.iconBg.replace('bg-', 'bg-gradient-to-r from-')} transition-all duration-500 group-hover:w-full`}></div>
    </div>
  );
};

export default {};
