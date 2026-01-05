import React from 'react';
import AnimatedNumber from './AnimatedNumber';

export default function MetricCard({ title, value, unit, subtitle, children }: { title: string; value: number | string; unit?: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow p-4 border border-emerald-100">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-emerald-500">{title}</div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-extrabold text-emerald-900">
              <AnimatedNumber value={typeof value === 'string' ? Number(value) : value} />
            </div>
            {unit && <div className="text-sm text-emerald-700">{unit}</div>}
          </div>
          {subtitle && <div className="text-xs text-emerald-500 mt-1">{subtitle}</div>}
        </div>
        <div className="ml-4 flex items-center">{children}</div>
      </div>
    </div>
  );
}
